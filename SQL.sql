-- =====================================================================================
-- SISTEMA INTEGRAL DE RESERVAS - SQL COMPLETO EN ESPAÑOL (MySQL 8)
-- =====================================================================================

DROP DATABASE IF EXISTS salud_reservas;
CREATE DATABASE salud_reservas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE salud_reservas;

-- ======================================================
-- 1. TABLA: USUARIOS
-- ======================================================
CREATE TABLE usuarios (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre             VARCHAR(80)   NOT NULL,
  apellidos          VARCHAR(120)  NOT NULL,
  correo_electronico VARCHAR(190)  NOT NULL UNIQUE,
  hash_contrasena    VARCHAR(255)  NOT NULL,
  telefono           VARCHAR(30),
  rol                ENUM('cliente','profesional','administrador') NOT NULL,
  especialidad       ENUM('fisioterapeuta','nutricionista','entrenador','psicologo_deportivo') NULL,
  biografia          TEXT,
  creado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ======================================================
-- 2. TABLA: SERVICIOS
-- ======================================================
CREATE TABLE servicios (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre            VARCHAR(120) NOT NULL,
  descripcion       TEXT,
  duracion_minutos  SMALLINT UNSIGNED NOT NULL,
  categoria         ENUM('fisioterapia','nutricion','entrenamiento','psicologia') NOT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_servicio_nombre (nombre)
) ENGINE=InnoDB;

-- ======================================================
-- 3. TABLA: PROFESIONALES_SERVICIOS (N:M)
-- ======================================================
CREATE TABLE profesionales_servicios (
  id_profesional BIGINT UNSIGNED NOT NULL,
  id_servicio    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_profesional, id_servicio),
  CONSTRAINT fk_ps_usuario FOREIGN KEY (id_profesional)
      REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ps_servicio FOREIGN KEY (id_servicio)
      REFERENCES servicios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ======================================================
-- 4. TABLA: HORARIOS_SEMANALES
-- ======================================================
CREATE TABLE horarios_semanales (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_profesional BIGINT UNSIGNED NOT NULL,
  dia_semana     TINYINT UNSIGNED NOT NULL,  -- 0=domingo .. 6=sábado
  hora_inicio    TIME NOT NULL,
  hora_fin       TIME NOT NULL,
  CONSTRAINT fk_hs_prof FOREIGN KEY (id_profesional)
      REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CHECK (hora_fin > hora_inicio),
  INDEX ix_hs_prof (id_profesional, dia_semana, hora_inicio)
) ENGINE=InnoDB;

-- ======================================================
-- 5. TABLA: AUSENCIAS
-- ======================================================
CREATE TABLE ausencias (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_profesional    BIGINT UNSIGNED NOT NULL,
  fecha_hora_inicio DATETIME NOT NULL,
  fecha_hora_fin    DATETIME NOT NULL,
  motivo            VARCHAR(200),
  CONSTRAINT fk_aus_prof FOREIGN KEY (id_profesional)
      REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CHECK (fecha_hora_fin > fecha_hora_inicio),
  INDEX ix_aus_prof (id_profesional, fecha_hora_inicio, fecha_hora_fin)
) ENGINE=InnoDB;

-- ======================================================
-- 6. TABLA: RESERVAS
-- ======================================================
CREATE TABLE reservas (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_cliente         BIGINT UNSIGNED NOT NULL,
  id_profesional     BIGINT UNSIGNED NOT NULL,
  id_servicio        BIGINT UNSIGNED NOT NULL,
  fecha_hora_inicio  DATETIME NOT NULL,
  fecha_hora_fin     DATETIME NULL,
  estado             ENUM('pendiente','confirmada','rechazada','cancelada','completada')
                         NOT NULL DEFAULT 'pendiente',
  notas              TEXT,
  creado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_cli FOREIGN KEY (id_cliente)
      REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_res_prof FOREIGN KEY (id_profesional)
      REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_res_serv FOREIGN KEY (id_servicio)
      REFERENCES servicios(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX ix_res_prof (id_profesional, fecha_hora_inicio),
  INDEX ix_res_cli  (id_cliente,     fecha_hora_inicio)
) ENGINE=InnoDB;

-- ======================================================
-- 7. TABLA: NOTIFICACIONES
-- ======================================================
CREATE TABLE notificaciones (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_reserva        BIGINT UNSIGNED NOT NULL,
  tipo_notificacion ENUM('solicitud','confirmacion','rechazo','recordatorio','cancelacion')
                        NOT NULL,
  enviada_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_res FOREIGN KEY (id_reserva)
      REFERENCES reservas(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX ix_notif_res (id_reserva, enviada_en)
) ENGINE=InnoDB;

-- ======================================================
-- FUNCIONES Y TRIGGERS
-- ======================================================
DELIMITER $$

-- ---------- TRIGGERS: profesionales_servicios (validar rol) ----------
CREATE TRIGGER trg_ps_rol_profesional_ins
BEFORE INSERT ON profesionales_servicios
FOR EACH ROW
BEGIN
  DECLARE rol_usuario ENUM('cliente','profesional','administrador');
  SELECT rol INTO rol_usuario
  FROM usuarios
  WHERE id = NEW.id_profesional;

  IF rol_usuario <> 'profesional' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Solo se pueden asignar servicios a usuarios con rol PROFESIONAL.';
  END IF;
END$$

CREATE TRIGGER trg_ps_rol_profesional_upd
BEFORE UPDATE ON profesionales_servicios
FOR EACH ROW
BEGIN
  DECLARE rol_usuario ENUM('cliente','profesional','administrador');
  SELECT rol INTO rol_usuario
  FROM usuarios
  WHERE id = NEW.id_profesional;

  IF rol_usuario <> 'profesional' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Solo se pueden asignar servicios a usuarios con rol PROFESIONAL.';
  END IF;
END$$

-- ---------- FUNCIÓN: comprobar horario semanal ----------
CREATE FUNCTION fn_esta_en_horario(
  p_profesional BIGINT,
  p_inicio      DATETIME,
  p_fin         DATETIME
) RETURNS TINYINT
DETERMINISTIC
BEGIN
  DECLARE v_ok  INT DEFAULT 0;
  DECLARE v_dia TINYINT;

  SET v_dia = WEEKDAY(p_inicio); -- 0=lunes..6=domingo

  SELECT COUNT(*) INTO v_ok
  FROM horarios_semanales hs
  WHERE hs.id_profesional = p_profesional
    AND ((hs.dia_semana + 6) % 7) = v_dia
    AND TIME(p_inicio) >= hs.hora_inicio
    AND TIME(p_fin)    <= hs.hora_fin;

  RETURN (v_ok > 0);
END$$

-- ---------- FUNCIÓN: comprobar solape con ausencias ----------
CREATE FUNCTION fn_solapa_ausencia(
  p_profesional BIGINT,
  p_inicio      DATETIME,
  p_fin         DATETIME
) RETURNS TINYINT
DETERMINISTIC
BEGIN
  DECLARE v_cnt INT DEFAULT 0;

  SELECT COUNT(*) INTO v_cnt
  FROM ausencias a
  WHERE a.id_profesional = p_profesional
    AND NOT (p_fin <= a.fecha_hora_inicio OR p_inicio >= a.fecha_hora_fin);

  RETURN (v_cnt > 0);
END$$

-- ---------- TRIGGER: completar hora fin en INSERT ----------
CREATE TRIGGER trg_res_set_fin_ins
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
  DECLARE v_dur SMALLINT;

  IF NEW.fecha_hora_fin IS NULL THEN
    SELECT duracion_minutos INTO v_dur
    FROM servicios
    WHERE id = NEW.id_servicio;

    SET NEW.fecha_hora_fin =
        DATE_ADD(NEW.fecha_hora_inicio, INTERVAL v_dur MINUTE);
  END IF;
END$$

-- ---------- TRIGGER: completar hora fin en UPDATE ----------
CREATE TRIGGER trg_res_set_fin_upd
BEFORE UPDATE ON reservas
FOR EACH ROW
BEGIN
  DECLARE v_dur SMALLINT;

  IF NEW.fecha_hora_fin IS NULL THEN
    SELECT duracion_minutos INTO v_dur
    FROM servicios
    WHERE id = NEW.id_servicio;

    SET NEW.fecha_hora_fin =
        DATE_ADD(NEW.fecha_hora_inicio, INTERVAL v_dur MINUTE);
  END IF;
END$$

-- ---------- TRIGGER: evitar solapes en INSERT ----------
CREATE TRIGGER trg_res_no_solape_ins
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
  DECLARE v_cnt INT DEFAULT 0;

  SELECT COUNT(*) INTO v_cnt
  FROM reservas r
  WHERE r.id_profesional = NEW.id_profesional
    AND r.estado IN ('pendiente','confirmada','completada')
    AND NOT (NEW.fecha_hora_fin <= r.fecha_hora_inicio
             OR NEW.fecha_hora_inicio >= r.fecha_hora_fin);

  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El profesional ya tiene una reserva en ese intervalo.';
  END IF;
END$$

-- ---------- TRIGGER: evitar solapes en UPDATE ----------
CREATE TRIGGER trg_res_no_solape_upd
BEFORE UPDATE ON reservas
FOR EACH ROW
BEGIN
  DECLARE v_cnt INT DEFAULT 0;

  SELECT COUNT(*) INTO v_cnt
  FROM reservas r
  WHERE r.id_profesional = NEW.id_profesional
    AND r.id <> NEW.id
    AND r.estado IN ('pendiente','confirmada','completada')
    AND NOT (NEW.fecha_hora_fin <= r.fecha_hora_inicio
             OR NEW.fecha_hora_inicio >= r.fecha_hora_fin);

  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El profesional ya tiene una reserva en ese intervalo.';
  END IF;
END$$

-- ---------- TRIGGERS: cliente y profesional NO pueden ser la misma persona ----------
CREATE TRIGGER trg_res_cliente_prof_distintos_ins
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
  IF NEW.id_cliente = NEW.id_profesional THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El cliente y el profesional no pueden ser la misma persona.';
  END IF;
END$$

CREATE TRIGGER trg_res_cliente_prof_distintos_upd
BEFORE UPDATE ON reservas
FOR EACH ROW
BEGIN
  IF NEW.id_cliente = NEW.id_profesional THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El cliente y el profesional no pueden ser la misma persona.';
  END IF;
END$$

-- ---------- TRIGGER: validar horario / ausencias en INSERT ----------
CREATE TRIGGER trg_res_valida_horario_ins
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
  IF fn_esta_en_horario(NEW.id_profesional,
                         NEW.fecha_hora_inicio,
                         NEW.fecha_hora_fin) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La reserva está fuera del horario laboral del profesional.';
  END IF;

  IF fn_solapa_ausencia(NEW.id_profesional,
                         NEW.fecha_hora_inicio,
                         NEW.fecha_hora_fin) = 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El profesional está marcado como no disponible.';
  END IF;
END$$

-- ---------- TRIGGER: validar horario / ausencias en UPDATE ----------
CREATE TRIGGER trg_res_valida_horario_upd
BEFORE UPDATE ON reservas
FOR EACH ROW
BEGIN
  IF fn_esta_en_horario(NEW.id_profesional,
                         NEW.fecha_hora_inicio,
                         NEW.fecha_hora_fin) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La reserva está fuera del horario laboral del profesional.';
  END IF;

  IF fn_solapa_ausencia(NEW.id_profesional,
                         NEW.fecha_hora_inicio,
                         NEW.fecha_hora_fin) = 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El profesional está marcado como no disponible.';
  END IF;
END$$

DELIMITER ;

-- ======================================================
-- VISTAS
-- ======================================================
CREATE VIEW v_agenda_profesional AS
SELECT
  r.id,
  r.id_profesional,
  CONCAT(p.nombre, ' ', p.apellidos) AS nombre_profesional,
  r.id_cliente,
  CONCAT(c.nombre, ' ', c.apellidos) AS nombre_cliente,
  s.nombre AS servicio,
  r.fecha_hora_inicio,
  r.fecha_hora_fin,
  r.estado
FROM reservas r
JOIN usuarios p ON p.id = r.id_profesional
JOIN usuarios c ON c.id = r.id_cliente
JOIN servicios s ON s.id = r.id_servicio;

CREATE VIEW v_reservas_cliente AS
SELECT
  r.id,
  r.id_cliente,
  r.id_profesional,
  s.nombre AS servicio,
  r.fecha_hora_inicio,
  r.fecha_hora_fin,
  r.estado
FROM reservas r
JOIN servicios s ON s.id = r.id_servicio
WHERE r.fecha_hora_inicio >= NOW();

-- ======================================================
-- DATOS DE EJEMPLO BÁSICOS
-- ======================================================
INSERT INTO usuarios (nombre,apellidos,correo_electronico,hash_contrasena,telefono,rol,especialidad)
VALUES
('Ana','Fisio','ana@centro.com','demo','600000001','profesional','fisioterapeuta'),
('Luis','Nutri','luis@centro.com','demo','600000002','profesional','nutricionista');

INSERT INTO usuarios (nombre,apellidos,correo_electronico,hash_contrasena,telefono,rol)
VALUES
('Admin','Centro','admin@centro.com','demo',NULL,'administrador'),
('Raúl','Paciente','paciente@demo.com','demo','600000003','cliente');

INSERT INTO servicios (nombre,descripcion,duracion_minutos,categoria)
VALUES
('Sesión de Fisioterapia','Rehabilitación y terapia manual',60,'fisioterapia'),
('Consulta de Nutrición','Evaluación y plan alimentario',45,'nutricion');

INSERT INTO profesionales_servicios (id_profesional,id_servicio)
SELECT u.id, s.id
FROM usuarios u
JOIN servicios s
  ON (u.especialidad='fisioterapeuta' AND s.categoria='fisioterapia')
  OR (u.especialidad='nutricionista'   AND s.categoria='nutricion');

-- Disponibilidad L-V 09-14 y 16-18 para Ana
INSERT INTO horarios_semanales (id_profesional,dia_semana,hora_inicio,hora_fin)
SELECT u.id, d.dia, t.hora_ini, t.hora_fin
FROM usuarios u
JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
JOIN (SELECT TIME('09:00:00') AS hora_ini, TIME('14:00:00') AS hora_fin
      UNION ALL
      SELECT TIME('16:00:00'), TIME('18:00:00')) t
WHERE u.correo_electronico='ana@centro.com';

-- Ejemplo de reserva válida (descomenta para probar):
-- INSERT INTO reservas (id_cliente,id_profesional,id_servicio,fecha_hora_inicio)
-- VALUES (
--   (SELECT id FROM usuarios WHERE correo_electronico='paciente@demo.com'),
--   (SELECT id FROM usuarios WHERE correo_electronico='ana@centro.com'),
--   (SELECT id FROM servicios WHERE nombre='Sesión de Fisioterapia'),
--   '2025-11-10 09:30:00'
-- );

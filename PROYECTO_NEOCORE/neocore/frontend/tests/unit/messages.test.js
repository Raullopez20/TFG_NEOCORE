const es = require('../../src/messages/es.json');
const en = require('../../src/messages/en.json');

describe('i18n message catalogs', () => {
  test('es and en include core navigation keys', () => {
    expect(es.nav).toBeDefined();
    expect(en.nav).toBeDefined();

    expect(es.nav.home).toBeTruthy();
    expect(es.nav.services).toBeTruthy();
    expect(es.nav.login).toBeTruthy();

    expect(en.nav.home).toBeTruthy();
    expect(en.nav.services).toBeTruthy();
    expect(en.nav.login).toBeTruthy();
  });

  test('booking status keys exist in both locales', () => {
    const keys = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED', 'DONE'];
    for (const key of keys) {
      expect(es.booking.status[key]).toBeTruthy();
      expect(en.booking.status[key]).toBeTruthy();
    }
  });
});

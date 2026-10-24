import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPassword, validateEmail, validateName, validateStudentId, PASSWORD_REGEX } from '../src/services/validation.ts';

test('accepts strong passwords', () => {
  for (const p of ['Tr1cky!Horse', 'C0gnitive#Adapt', 'Zx9$kLm2@qW']) {
    assert.equal(checkPassword(p).valid, true, p);
    assert.equal(PASSWORD_REGEX.test(p), true, p);
  }
});

test('rejects weak passwords', () => {
  const bad: Record<string, string> = {
    'Sh0rt!a': 'length',
    'alllowercase1!': 'upper',
    'ALLUPPERCASE1!': 'lower',
    'NoDigitsHere!!': 'digit',
    'NoSpecial1234': 'special',
    'Has Space1!x': 'space',
    'Baaa1!bcdefg': 'repeat',
    'Password123': 'special',
  };
  for (const [p, why] of Object.entries(bad)) {
    assert.equal(checkPassword(p).valid, false, `${p} should fail (${why})`);
  }
});

test('rejects common passwords, email and name reuse', () => {
  assert.equal(checkPassword('P@ssw0rd').valid, false);
  assert.equal(checkPassword('Joyleg!w4be9X', { email: 'joyleg@x.com' }).valid, false);
  assert.equal(checkPassword('Alexander#9Xk', { name: 'Alexander Henderson' }).valid, false);
});

test('strength score grows with quality', () => {
  assert.equal(checkPassword('').score, 0);
  assert.ok(checkPassword('abc').score <= 1);
  assert.ok(checkPassword('Tr1cky!Horse-Battery9').score >= 3);
});

test('email, name, student id validators', () => {
  assert.equal(validateEmail('a@b.co'), null);
  assert.equal(validateEmail('Name.Surname+tag@uni.ac.za'), null);
  for (const e of ['', 'plain', 'a@b', 'a@@b.com', 'a b@c.com', '@x.com']) assert.notEqual(validateEmail(e), null, e);
  assert.equal(validateName("Zoë O'Brien-Smith"), null);
  assert.notEqual(validateName('x'), null);
  assert.notEqual(validateName('<script>'), null);
  assert.equal(validateStudentId(''), null);
  assert.equal(validateStudentId('STU-89210'), null);
  assert.notEqual(validateStudentId('a b'), null);
});

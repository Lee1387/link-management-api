import { ScryptPasswordHasher } from './scrypt-password-hasher';

describe('ScryptPasswordHasher', () => {
  it('should hash passwords into a structured scrypt string', async () => {
    const passwordHasher = new ScryptPasswordHasher();

    const hash = await passwordHasher.hash('my-secure-password');

    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(hash).not.toBe('my-secure-password');
  });

  it('should generate different hashes for the same password', async () => {
    const passwordHasher = new ScryptPasswordHasher();

    const firstHash = await passwordHasher.hash('my-secure-password');
    const secondHash = await passwordHasher.hash('my-secure-password');

    expect(firstHash).not.toBe(secondHash);
  });

  it('should verify a correct password against its hash', async () => {
    const passwordHasher = new ScryptPasswordHasher();
    const hash = await passwordHasher.hash('my-secure-password');

    await expect(
      passwordHasher.verify('my-secure-password', hash),
    ).resolves.toBe(true);
  });

  it('should reject an incorrect password for a valid hash', async () => {
    const passwordHasher = new ScryptPasswordHasher();
    const hash = await passwordHasher.hash('my-secure-password');

    await expect(passwordHasher.verify('wrong-password', hash)).resolves.toBe(
      false,
    );
  });

  it('should reject malformed hashes', async () => {
    const passwordHasher = new ScryptPasswordHasher();

    await expect(
      passwordHasher.verify('my-secure-password', 'invalid-hash'),
    ).resolves.toBe(false);
  });
});

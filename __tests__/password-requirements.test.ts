/// <reference types="jest" />
import { getPasswordRequirementStates } from '../src/features/public/auth/models/password-requirements';

describe('getPasswordRequirementStates', () => {
  it('acepta una contraseña que cumple los tres requisitos', () => {
    expect(getPasswordRequirementStates('Clave123!').map(({ isMet }) => isMet)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('rechaza una contraseña demasiado corta aunque tenga letras, número y símbolo', () => {
    expect(getPasswordRequirementStates('Ab1!').map(({ isMet }) => isMet)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('exige mayúsculas y minúsculas', () => {
    expect(getPasswordRequirementStates('clave123!').find(({ id }) => id === 'letterCase')?.isMet).toBe(false);
    expect(getPasswordRequirementStates('CLAVE123!').find(({ id }) => id === 'letterCase')?.isMet).toBe(false);
  });

  it('exige tanto un número como un símbolo', () => {
    expect(getPasswordRequirementStates('Claveabcd!').find(({ id }) => id === 'numberAndSymbol')?.isMet).toBe(false);
    expect(getPasswordRequirementStates('Clave1234').find(({ id }) => id === 'numberAndSymbol')?.isMet).toBe(false);
  });
});

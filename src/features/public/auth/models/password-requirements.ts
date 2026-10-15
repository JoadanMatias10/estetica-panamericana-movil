export type PasswordRequirementState = {
  id: 'length' | 'letterCase' | 'numberAndSymbol';
  isMet: boolean;
  label: string;
};

export function getPasswordRequirementStates(password: string): PasswordRequirementState[] {
  return [
    {
      id: 'length',
      isMet: password.length >= 8,
      label: 'Mínimo 8 caracteres',
    },
    {
      id: 'letterCase',
      isMet: /[a-z]/.test(password) && /[A-Z]/.test(password),
      label: 'Mayúscula y minúscula',
    },
    {
      id: 'numberAndSymbol',
      isMet: /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
      label: 'Número y símbolo',
    },
  ];
}

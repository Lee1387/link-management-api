export interface ShortCodeGenerator {
  generate(): string;
}

export const SHORT_CODE_GENERATOR = Symbol('SHORT_CODE_GENERATOR');

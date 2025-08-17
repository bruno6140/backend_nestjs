import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export const IS_API_KEY = 'isApiKey';

export function ExposeApi() {
  return applyDecorators(
    SetMetadata(IS_API_KEY, true),
    ApiSecurity('Api-Key-Auth'),
  );
}

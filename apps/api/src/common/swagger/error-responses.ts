import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

export const ApiBadRequest = (description: string) =>
  ApiBadRequestResponse({ type: ErrorResponseDto, description });

export const ApiNotFound = (description: string) =>
  ApiNotFoundResponse({ type: ErrorResponseDto, description });

export const ApiConflict = (description: string) =>
  ApiConflictResponse({ type: ErrorResponseDto, description });

export const ApiGone = (description: string) =>
  ApiGoneResponse({ type: ErrorResponseDto, description });

export const ApiUnauthorized = (description: string) =>
  ApiUnauthorizedResponse({ type: ErrorResponseDto, description });

export const MISSING_TOKEN_DESCRIPTION =
  'Missing, malformed or expired access token.';

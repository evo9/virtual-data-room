import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto, UserResponseDto } from './dto/responses.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import {
  ApiBadRequest,
  ApiConflict,
  ApiUnauthorized,
  MISSING_TOKEN_DESCRIPTION,
} from '@/common/swagger/error-responses';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Create an account',
    description:
      'Creates the user together with an empty default data room named "My Data Room" and returns an access token, so the client is logged in right away.',
  })
  @ApiCreatedResponse({ type: TokenResponseDto })
  @ApiBadRequest(
    'Validation failed (invalid email, password shorter than 8 characters, missing name).',
  )
  @ApiConflict('An account with this email already exists.')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Wrong email and wrong password produce the same 401 message, so the endpoint cannot be used to find out which emails are registered.',
  })
  @ApiOkResponse({ type: TokenResponseDto })
  @ApiBadRequest('Validation failed (malformed email, empty password).')
  @ApiUnauthorized('Invalid email or password.')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current user',
    description:
      'Profile of the token owner. The web app calls it on start-up to validate a stored token.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorized(MISSING_TOKEN_DESCRIPTION)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}

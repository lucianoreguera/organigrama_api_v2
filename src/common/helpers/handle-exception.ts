import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

export function handleExceptions(error: any, modelName: string) {
  if (error.code === 11000) {
    throw new BadRequestException(
      `${modelName} already exists in db ${JSON.stringify(error.keyValue)}`,
    );
  }
  throw new InternalServerErrorException(
    `Can't create ${modelName.toLowerCase()} - Check server logs`,
  );
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { MessageDTO } from './dto/message.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  async createMessage(dto: MessageDTO) {
    try {
      const openai = new OpenAI();
      const thread = dto.thread_id
        ? { id: dto.thread_id }
        : await openai.beta.threads.create();

      const message = await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: dto.message,
      });
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.ASSISTANT_ID,
      });
      this.logger.debug(
        `Sending message to thread: ${thread.id} with message id: ${message.id} and text message: ${dto.message}`,
      );

      let runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id,
      );

      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      const listOfMessages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = listOfMessages.data
        .filter(
          (message) =>
            message.run_id === run.id && message.role === 'assistant',
        )
        .pop();
      return {
        success: true,
        data: {
          thread_id: thread.id,
          response: lastMessage.content[0]['text'].value,
          role: 'assistant',
        },
      };
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException(err.message);
    }
  }
}

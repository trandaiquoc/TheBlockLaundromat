import { Injectable } from '@angular/core';
import type { DioramaProjectProjection } from './diorama-project-anchor-projector';

@Injectable()
export class DioramaProjectProjectionBridge {
  private receiver?: (projection: DioramaProjectProjection | undefined) => void;
  private latest?: DioramaProjectProjection;

  connect(receiver: (projection: DioramaProjectProjection | undefined) => void): () => void {
    this.receiver = receiver;
    receiver(this.latest);
    return () => {
      if (this.receiver === receiver) this.receiver = undefined;
    };
  }

  publish(projection: DioramaProjectProjection): void {
    this.latest = projection;
    this.receiver?.(projection);
  }

  clear(): void {
    this.latest = undefined;
    this.receiver?.(undefined);
  }
}

import type { LanguageModelMiddleware } from 'ai';

type WrapStreamResult = Awaited<ReturnType<NonNullable<LanguageModelMiddleware['wrapStream']>>>;

/** One part of a model's stream, as a provider hands it to the SDK. */
export type ModelStreamPart = WrapStreamResult['stream'] extends ReadableStream<infer TPart> ? TPart : never;

type ReasoningDeltaPart = Extract<ModelStreamPart, { type: 'reasoning-delta' }>;

/** Whether a reasoning delta carries its block's signature, under any provider's name for it. */
const hasSignature = (part: ReasoningDeltaPart): boolean =>
  Object.values(part.providerMetadata ?? {}).some(
    (metadata) => metadata !== null && typeof metadata === 'object' && 'signature' in metadata && metadata.signature != null,
  );

/**
 * A stream transform that gives every block of a model's reasoning its own part.
 *
 * A provider can deliver two reasoning blocks under one id: text, a signature, more text, a second
 * signature, then a single end. Read as one part, the texts are joined and only the last signature
 * survives, so the next step sends back a block the model never wrote and drops one it did. A model
 * that checks its own reasoning history then refuses the request.
 *
 * A signature ends a block. So when reasoning arrives under an id whose part already has its
 * signature, that part is ended and a new one is started for what follows, under a new id made
 * from the provider's. Every other part passes through untouched.
 */
export const createSplitMergedReasoningTransform = (): TransformStream<ModelStreamPart, ModelStreamPart> => {
  // The id of the part now open for each provider id.
  const openPartIds = new Map<string, string>();
  // The parts that already have their signature.
  const signedPartIds = new Set<string>();
  let splitCount = 0;

  return new TransformStream<ModelStreamPart, ModelStreamPart>({
    transform(part, controller) {
      if (part.type === 'reasoning-start') {
        openPartIds.set(part.id, part.id);
        controller.enqueue(part);
        return;
      }

      if (part.type === 'reasoning-delta') {
        let id = openPartIds.get(part.id) ?? part.id;

        if (signedPartIds.has(id)) {
          controller.enqueue({ type: 'reasoning-end', id });

          splitCount += 1;
          id = `${part.id}:${splitCount}`;
          openPartIds.set(part.id, id);

          controller.enqueue({ type: 'reasoning-start', id });
        }

        if (hasSignature(part)) {
          signedPartIds.add(id);
        }

        controller.enqueue({ ...part, id });
        return;
      }

      if (part.type === 'reasoning-end') {
        const id = openPartIds.get(part.id) ?? part.id;
        openPartIds.delete(part.id);

        controller.enqueue({ ...part, id });
        return;
      }

      controller.enqueue(part);
    },
  });
};

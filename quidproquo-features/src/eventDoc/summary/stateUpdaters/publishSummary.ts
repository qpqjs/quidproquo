import { EventDocEventPayload, EventDocPublishData, EventDocSummaryView } from '../../models';

/** Stamps the open draft (the one version without publishedAt) with publishedAt and effectiveFrom. */
export const publishSummary = (model: EventDocSummaryView, { data, metadata }: EventDocEventPayload<EventDocPublishData>): EventDocSummaryView => ({
  ...model,
  versions: model.versions.map((version) =>
    version.publishedAt === undefined
      ? {
          ...version,
          publishedAt: metadata.createdAt,
          effectiveFrom: data.effectiveFrom,
        }
      : version,
  ),
});

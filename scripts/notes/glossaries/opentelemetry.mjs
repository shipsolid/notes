// Hand-curated subset of OpenTelemetry's own glossary/spec terms this wiki
// cares about. Not an exhaustive mirror of OTel's docs — add terms here as
// they surface as gaps (see check-glossary-gaps.mjs).
export default [
  { term: 'OTLP', aliases: ['OpenTelemetry Protocol'] },
  { term: 'Head Sampling', aliases: ['head-based sampling'] },
  { term: 'Tail Sampling', aliases: ['tail-based sampling'] },
  { term: 'Trace Context', aliases: ['W3C Trace Context', 'traceparent'] },
  { term: 'Collector Pipeline', aliases: ['OTel Collector'] },
  { term: 'Semantic Conventions', aliases: ['semconv'] },
  { term: 'Span Link', aliases: [] },
  { term: 'Baggage', aliases: [] },
  { term: 'Exemplars', aliases: [] },
];

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Create OpenTelemetry exporters
const traceExporter = new OTLPTraceExporter({
  // For Datadog, use the Datadog agent URL
  // Environment variables should be used in production
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {
    // Add any authentication headers needed for your exporter
    // For Datadog: 'X-Datadog-API-Key': process.env.DD_API_KEY
  },
});

// Configure OpenTelemetry SDK
export const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ofauto-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument popular libraries
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-prisma': { enabled: true },
    }),
  ],
});

// Function to start the OpenTelemetry SDK
export function initializeOpenTelemetry() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      otelSDK.start();
      console.log('OpenTelemetry initialized successfully');
      
      // Handle shutdown gracefully
      process.on('SIGTERM', () => {
        otelSDK.shutdown()
          .then(() => console.log('OpenTelemetry SDK shut down'))
          .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
          .finally(() => process.exit(0));
      });
    } catch (error) {
      console.error('Error initializing OpenTelemetry', error);
    }
  }
}

// Export tracing utilities for manual instrumentation
export * from '@opentelemetry/api'; 
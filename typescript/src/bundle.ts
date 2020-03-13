export interface Thresholds {
  element_count_threshold: number;
  request_byte_threshold: number;
  delay_threshold_millis: number;
}
export interface BatchDescriptor {
  batched_field: string;
  discriminator_fields: string[];
  subresponse_field?: string;
}
export interface BundleConfig {
  serviceName: string;
  methodName: string;
  thresholds: Thresholds;
  batchDescriptor: BatchDescriptor;
}

export class BundleConfigClient {
  bundleConfigs: BundleConfig[] = [];
  // tslint:disable-next-line no-any
  fromObject(yaml: any) {
    // construct meaning Object from GAPIC v2 file.
    const interfaces = yaml['interfaces'];
    for (const oneInterface of interfaces) {
      // service name: google.logging.v2.LoggingServiceV2
      const serviceName: string = oneInterface['name'];
      const shortenedServiceName = serviceName.substring(
        serviceName.lastIndexOf('.')
      );
      if (!oneInterface['methods']) {
        continue;
      }
      const methods = oneInterface['methods'];
      for (const method of methods) {
        if (!method['batching']) {
          continue;
        }
        const name = method['name'];
        const elementCountThreshold =
          method['thresholds']['element_count_threshold'];
        const requestByteThreshold =
          method['thresholds']['request_byte_threshold'];
        const delayThresholdMillis =
          method['thresholds']['delay_threshold_millis'];
        const batchedField = method['batch_descriptor']['batched_field'];
        const discriminatorFields =
          method['batch_descriptor']['discriminator_fields'];
        const oneBundleConfig: BundleConfig = {
          serviceName: shortenedServiceName,
          methodName: name,
          thresholds: {
            element_count_threshold: elementCountThreshold,
            request_byte_threshold: requestByteThreshold,
            delay_threshold_millis: delayThresholdMillis,
          },
          batchDescriptor: {
            batched_field: batchedField,
            discriminator_fields: discriminatorFields,
          },
        };
        if (method['batch_descriptor']['subresponse_field']) {
          const subresponseField =
            method['batch_descriptor']['subresponse_field'];
          Object.assign(oneBundleConfig, {
            batchDescriptor: {
              batched_field: batchedField,
              discriminator_fields: discriminatorFields,
              subresponse_field: subresponseField,
            },
          });
        }
        this.bundleConfigs.push(oneBundleConfig);
      }
    }
    return this.bundleConfigs;
  }
}

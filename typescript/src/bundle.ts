export interface Thresholds {
  element_count_threshold: number;
  request_byte_threshold: number;
  delay_threshold_millis: number;
  element_count_limit?: number;
}
export interface BatchDescriptor {
  batched_field: string;
  discriminator_fields: string[];
  subresponse_field: string;
}
export interface BundleConfig {
  serviceName: string;
  methodName: string;
  thresholds: Thresholds;
  batchDescriptor: BatchDescriptor;
  repeatedField?: string;
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
        serviceName.lastIndexOf('.') + 1
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
        const config = method['batching'];
        const elementCountThreshold =
          config['thresholds']['element_count_threshold'];
        const requestByteThreshold =
          config['thresholds']['request_byte_threshold'];
        const delayThresholdMillis =
          config['thresholds']['delay_threshold_millis'];
        const elementCountLimit =
          config['thresholds']['element_count_limit'] ?? 1000000;
        const batchedField = config['batch_descriptor']['batched_field'];
        const discriminatorFields =
          config['batch_descriptor']['discriminator_fields'];
        const oneBundleConfig: BundleConfig = {
          serviceName: shortenedServiceName,
          methodName: name,
          thresholds: {
            element_count_threshold: elementCountThreshold,
            request_byte_threshold: requestByteThreshold,
            delay_threshold_millis: delayThresholdMillis,
            element_count_limit: elementCountLimit,
          },
          batchDescriptor: {
            batched_field: batchedField,
            discriminator_fields: discriminatorFields,
            subresponse_field: 'null',
          },
        };
        if (config['batch_descriptor']['subresponse_field']) {
          let subresponseField =
            config['batch_descriptor']['subresponse_field'];
          subresponseField =
            subresponseField.length > 0 ? subresponseField : null;
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

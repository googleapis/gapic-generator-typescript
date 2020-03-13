export interface Thresholds{
    element_count_threshold: number
    request_byte_threshold: number
    delay_threshold_millis: number
}
export interface BatchDescriptor{
    batched_field: string,
    discriminator_fields: string[], 
    subresponse_field? :string
}
export interface BundleConfig{
    serviceName: string,
    methodName: string,
    thresholds: Thresholds,
    batchDescriptor: BatchDescriptor
}

export class BundleConfigClient{
    bundleConfigs: BundleConfig[] = [];
    // tslint:disable-next-line no-any
    fromObject(yaml: any){
        // construct meaning Object from GAPIC v2 file.
        const interfaces = yaml['interfaces']
        for(const oneInterface of interfaces){
            // service name: google.logging.v2.LoggingServiceV2
            const serviceName: string = oneInterface['name'];
            const shortenedServiceName = serviceName.substring(serviceName.lastIndexOf('.'));
            if(!oneInterface['methods']) {continue}
            const methods = oneInterface['methods'];
            for(const method of methods){
                if(!method['batching']) {continue}
                const name = method['name'];
                const element_count_threshold = method['thresholds']['element_count_threshold'];
                const request_byte_threshold = method['thresholds']['request_byte_threshold'];
                const delay_threshold_millis = method['thresholds']['delay_threshold_millis'];
                const batched_field = method['batch_descriptor']['batched_field'];
                const discriminator_fields = method['batch_descriptor']['discriminator_fields'];
                const oneBundleConfig: BundleConfig = {
                    serviceName: shortenedServiceName,
                    methodName: name,
                    thresholds: {element_count_threshold, request_byte_threshold, delay_threshold_millis},
                    batchDescriptor: {batched_field, discriminator_fields}
                }
                if(method['batch_descriptor']['subresponse_field']){
                    const subresponse_field = method['batch_descriptor']['subresponse_field'];
                    Object.assign(oneBundleConfig, {batchDescriptor: {batched_field, discriminator_fields, subresponse_field}})
                }
                this.bundleConfigs.push(oneBundleConfig);
            }
        }
        return this.bundleConfigs;
    }
}
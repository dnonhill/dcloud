export const RESOURCE_TYPE_VM = 'vm';
export const RESOURCE_TYPE_CONTAINER = 'container-cluster';
export const RESOURCE_TYPE_OTHER = 'other';
export type ResourceType = typeof RESOURCE_TYPE_VM | typeof RESOURCE_TYPE_CONTAINER | typeof RESOURCE_TYPE_OTHER;

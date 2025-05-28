import { Icon } from 'bloomer';
import { Icon as IconProps } from 'bloomer/lib/elements/Icon';
import _ from 'lodash';
import * as React from 'react';

import { ResourceProperty } from '../../api/resource';
import { DataField, Divider } from '../../components';
import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_VM } from '../../resource-type';
import { AddOnService, WebServerSpecification } from '../tickets/resource-spec';

export function extractIconClass(resourceType: string): string {
  switch (resourceType) {
    case RESOURCE_TYPE_VM:
      return 'fas fa-server';
    case RESOURCE_TYPE_CONTAINER:
      return 'fas fa-cloud';
    default:
      return 'fas fa-magic';
  }
}

type ResourceTypeIconProps = IconProps<HTMLSpanElement> & {
  resourceType: string;
};
export const ResourceTypeIcon: React.FC<ResourceTypeIconProps> = (props) => {
  const { resourceType, ...iconProps } = props;
  return <Icon className={extractIconClass(resourceType)} {...iconProps} />;
};

const VmDetailContent: React.FC<{ detail: any }> = ({ detail }) => (
  <>
    <DataField label="Resource name">
      <span data-field="cpu">{detail.name}</span>
    </DataField>
    <DataField label="vCPU">
      <span data-field="cpu">{detail.cpu}</span>&nbsp;cores
    </DataField>
    <DataField label="Memory">
      <span data-field="memory">{detail.memory}</span>&nbsp;GB
    </DataField>
    <DataField label="Operating system">
      <span data-field="os">{detail.displayOs}</span>
    </DataField>
    <Divider dataContent="Storage" />
    <DataField label="Storage tier">
      <span data-field="storage-tier">{detail.displayStorageTier}</span>
    </DataField>
    <DataField label="OS Disk">
      <span data-field="osDisk">{detail.osDisk}</span>&nbsp;GB
      {detail.additionalOsDisk && detail.additionalOsDisk > 0 && (
        <>
          <span> + </span>
          <span data-field="additionalOsDisk">{detail.additionalOsDisk}</span>
          <span> GB</span>
        </>
      )}
    </DataField>
    {detail.dataDisk1Size && (
      <DataField label="Data disk 1">
        <span data-field="dataDisk1Size">{detail.dataDisk1Size}</span>&nbsp;GB
      </DataField>
    )}
    {detail.dataDisk2Size && (
      <DataField label="Data disk 2">
        <span data-field="dataDisk1Size">{detail.dataDisk2Size}</span>&nbsp;GB
      </DataField>
    )}
    <DataField label="Protection level">
      <span data-field="protectionLevel">{detail.displayProtectionLevel}</span>
    </DataField>
    <Divider dataContent="Network" />
    <DataField label="Environments">
      <span data-field="environment">{detail.displayEnvironment || detail.environment}</span>
    </DataField>
    <DataField label="Network Zone">
      <span data-field="networkZone">{detail.displayNetworkZone}</span>
    </DataField>
    <DataField label="IP Address">
      <span data-field="ipAddress">{detail.ipAddress}</span>
    </DataField>
    {detail.database && (
      <>
        <Divider dataContent="Database" />
        <DataField label="Database Engine">
          <span className="database.engine">{detail.database.engine}</span>
        </DataField>
        <Divider dataContent="Database detail" />
        {detail.database &&
          detail.databaseDetails &&
          detail.databaseDetails.map((value: any, i: number) => {
            return (
              <div key={i}>
                {i > 0 && detail.databaseDetails.length != i && <hr />}
                {i > 0 && <div style={{ marginTop: '16px' }}></div>}
                <DataField label="Database Name">
                  <span className={`database${i}.name`}>{value.name || '-'}</span>
                </DataField>
                <DataField label="Data size">
                  <span className={`database${i}.dataSize`}>{value.dataSize || '-'}</span>&nbsp;GB
                </DataField>
                <DataField label="Database Account">
                  <span className="initialDbAccount">{value.databaseAccount || '-'}</span>
                </DataField>
              </div>
            );
          })}
      </>
    )}

    {detail?.maintenanceWindow && (
      <>
        <Divider dataContent="Maintenance Window" />
        <DataField label="Start day">
          <span data-field="maintenanceWindow.day">{_.capitalize(detail.maintenanceWindow.day)}</span>
        </DataField>
        <DataField label="Start time">
          <span data-field="maintenanceWindow.startTime">{detail.maintenanceWindow.startTime}</span>
        </DataField>
        <DataField label="Duration">
          <span data-field="maintenanceWindow.duration">{detail.maintenanceWindow.duration} hours</span>
        </DataField>
      </>
    )}

    {detail.webserver?.length !== 0 && detail.webserver && (
      <>
        <Divider dataContent="Webserver" />
        {Array.isArray(detail.webserver) ? (
          <>
            {detail?.webserver?.map((server: WebServerSpecification, i: number) => (
              <div key={i}>
                {i > 0 && detail.databaseDetails.length != i && <hr />}
                {i > 0 && <div style={{ marginTop: '16px' }}></div>}
                <DataField label="Application name">
                  <span data-field={`webserver[${i}].applicationName`}>{server.applicationName}</span>
                </DataField>
                <DataField label="Read/Write users">
                  <span data-field={`webserver[${i}].readWriteUsers`}>{server.readWriteUsers}</span>
                </DataField>
                <DataField label="Read only users">
                  <span data-field={`webserver[${i}].readOnlyUsers`}>{server.readOnlyUsers}</span>
                </DataField>
                <DataField label="Application path">
                  <span data-field={`webserver[${i}].applicationPath`}>{server.applicationPath}</span>
                </DataField>
              </div>
            ))}
          </>
        ) : (
          <>
            <DataField label="Application name">
              <span data-field="webserver.applicationName">
                {(detail.webserver as WebServerSpecification).applicationName}
              </span>
            </DataField>
            <DataField label="Read/Write users">
              <span data-field="webserver.readWriteUsers">
                {(detail.webserver as WebServerSpecification).readWriteUsers}
              </span>
            </DataField>
            <DataField label="Read only users">
              <span data-field="webserver.readOnlyUsers">
                {(detail.webserver as WebServerSpecification).readOnlyUsers}
              </span>
            </DataField>
            <DataField label="Application path">
              <span data-field="webserver.applicationPath">
                {(detail.webserver as WebServerSpecification).applicationPath}
              </span>
            </DataField>
          </>
        )}
      </>
    )}
    {Array.isArray(detail.addOnService) && (
      <>
        <Divider dataContent="Add-on Services" />
        <DataField label="Add-on Services">
          <ul>
            {detail.addOnService.map((service: AddOnService, index: number) => (
              <li key={`${index}-${service.value}`}>{service.display}</li>
            ))}
          </ul>
        </DataField>
      </>
    )}
  </>
);

const ContainerDetailContent: React.FC<{ detail: any }> = ({ detail }) => (
  <>
    <DataField label="Project name">
      <span data-field="namespace">{detail.namespace}</span>
    </DataField>
    {detail.projectUrl && (
      <DataField label="Project URL">
        <a href={detail.projectUrl} data-field="projectUrl" target="_blank" rel="noopener noreferrer">
          {detail.projectUrl}
        </a>
      </DataField>
    )}

    <Divider dataContent="Resource quota" />
    <DataField label="vCPU">
      <span data-field="cpu">{detail.cpu}</span>&nbsp;cores
    </DataField>
    <DataField label="Memory">
      <span data-field="memory">{detail.memory}</span>&nbsp;GB
    </DataField>
    <DataField label="Storage">
      <span data-field="mainStorage">{detail.mainStorage}</span>&nbsp;GB
    </DataField>

    <Divider dataContent="Project membership" />
    <DataField label="Project member">
      <ul>
        {((detail.members as string[]) || []).map((member) => (
          <li data-field="member">PTTGRP/{member}</li>
        ))}
      </ul>
    </DataField>
  </>
);

export const DetailContent: React.FC<{ resource: ResourceProperty }> = (props) => {
  switch (props.resource.resourceType) {
    case RESOURCE_TYPE_VM:
      return <VmDetailContent detail={props.resource.details} />;
    case RESOURCE_TYPE_CONTAINER:
      return <ContainerDetailContent detail={props.resource.details} />;
    default:
      return null;
  }
};

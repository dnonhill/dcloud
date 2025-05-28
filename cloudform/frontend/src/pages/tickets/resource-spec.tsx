import { Icon } from 'bloomer';
import _ from 'lodash';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { ResourceProperty } from '../../api/resource';
import { TicketItemRequest } from '../../api/ticket';
import { DataField, Divider } from '../../components';
import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_OTHER, RESOURCE_TYPE_VM } from '../../resource-type';

export interface DatabaseSpecification {
  engine: string;
  detail: DatabaseDetail[];
}

export interface DatabaseDetail {
  name: string;
  dataSize: number;
}

export interface WebServerSpecification {
  applicationName: string | null;
  readWriteUsers: string | null;
  readOnlyUsers: string | null;
  applicationPath: string | null;
}

export interface AddOnService {
  display: string;
  value: string;
}

export type Day = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export interface MaintenanceWindowSpecification {
  day: Day | string;
  startTime: string;
  duration: string;
}

export interface VmSpecification {
  name: string;
  cpu: number;
  memory: number;
  os: string | undefined;
  displayOs: string | undefined;
  osType: string | undefined;
  storageTier: string | undefined;
  displayStorageTier: string | undefined;
  osDisk: number;
  additionalOsDisk: number | undefined;
  dataDisk1Size: number | undefined;
  dataDisk2Size: number | undefined;
  protectionLevel: string | undefined;
  displayProtectionLevel: string | undefined;
  environment: string | undefined;
  displayEnvironment: string | undefined;
  networkZone: string | undefined;
  displayNetworkZone: string | undefined;
  database: DatabaseSpecification | null;
  webserver: WebServerSpecification[] | null;
  databaseDetails: DatabaseDetail[];
  addOnService: AddOnService[] | null;
  maintenanceWindow: MaintenanceWindowSpecification;
}

export interface ContainerSpecification {
  namespace: string;
  cpu: number;
  memory: number;
  mainStorage: number;
  members: string[];
}

export interface OtherSpecification {
  message: string;
}

const ChangedPreviewer: React.FC<{
  newSpec?: string | number | undefined | null;
  currentSpec?: string | number | undefined | null;
  unit?: string;
}> = ({ newSpec, currentSpec, unit }) => {
  if (!newSpec && !currentSpec) {
    return null;
  }

  if (currentSpec && newSpec && currentSpec !== newSpec) {
    return (
      <>
        <span className="tag is-danger is-light is-medium">
          {currentSpec}&nbsp;{unit}
        </span>
        <span className="icon">
          <i className="fas fa-arrow-right"></i>
        </span>
        <span className="tag is-success is-light is-medium">
          {newSpec}&nbsp;{unit}
        </span>
      </>
    );
  } else if (!currentSpec && newSpec) {
    return (
      <span className="tag is-success is-light is-medium">
        {newSpec}&nbsp;{unit}
      </span>
    );
  } else if (currentSpec && !newSpec) {
    return (
      <span className="tag is-danger is-light is-medium">
        {currentSpec}&nbsp;{unit}
      </span>
    );
  } else {
    return (
      <span>
        {currentSpec}&nbsp;{unit}
      </span>
    );
  }
};

const ContainerUpdatedSpecificationContent: React.FC<{
  newSpec: ContainerSpecification;
  currentSpec?: ContainerSpecification;
  isPriceCalculator: boolean;
}> = ({ newSpec, currentSpec, isPriceCalculator }) => (
  <>
    <DataField label="Project name">
      <span data-field="namespace">{newSpec.namespace}</span>
    </DataField>

    <Divider dataContent="Resource quota" />
    <DataField label="vCPU">
      <ChangedPreviewer newSpec={newSpec.cpu} currentSpec={currentSpec?.cpu} unit={'cores'} />
    </DataField>
    <DataField label="Memory">
      <ChangedPreviewer newSpec={newSpec.memory} currentSpec={currentSpec?.memory} unit={'GB'} />
    </DataField>
    <DataField label="Storage">
      <ChangedPreviewer newSpec={newSpec.mainStorage} currentSpec={currentSpec?.mainStorage} unit={'GB'} />
      {/* <span data-field="mainStorage">{spec.mainStorage}</span>&nbsp;GB */}
    </DataField>

    {isPriceCalculator ? (
      ''
    ) : (
      <>
        <Divider dataContent="Project membership" />
        <DataField label="Project members">
          <ul>
            {(newSpec.members || []).map((member) => (
              <li data-field="member" key={member}>
                PTTGRP/{member}
              </li>
            ))}
          </ul>
        </DataField>
      </>
    )}
  </>
);

const VmUpdatedSpecificationContent: React.FC<{
  newSpec: VmSpecification;
  currentSpec?: VmSpecification;
  isPriceCalculator: boolean;
}> = ({ newSpec, currentSpec, isPriceCalculator }) => {
  var databaseDetailMain: DatabaseDetail[]
  var currentSpecDatabaseDetails = currentSpec?.databaseDetails || []
  var newSpecDatabaseDetails = newSpec.databaseDetails || []
  try {
    databaseDetailMain =
    newSpec.databaseDetails.length > (currentSpec?.databaseDetails.length || 0)
      ? newSpecDatabaseDetails
      : currentSpecDatabaseDetails;
  } catch (error) {
    databaseDetailMain = []
  }
  
  const webserverMain =
    (newSpec?.webserver?.length || 0) > (currentSpec?.webserver?.length || 0)
      ? newSpec?.webserver
      : currentSpec?.webserver;

  const currentAddOnService = React.useMemo(() => _.sortBy(currentSpec?.addOnService, ['value']), [
    currentSpec?.addOnService,
  ]);
  const newAddOnService = React.useMemo(() => _.sortBy(newSpec?.addOnService, ['value']), [newSpec?.addOnService]);

  return (
    <>
      <DataField label="vCPU">
        <ChangedPreviewer newSpec={newSpec.cpu} currentSpec={currentSpec?.cpu} unit={'cores'} />
      </DataField>
      <DataField label="Memory">
        <ChangedPreviewer newSpec={newSpec.memory} currentSpec={currentSpec?.memory} unit={'GB'} />
      </DataField>
      <DataField label="Operating system">
        <ChangedPreviewer newSpec={newSpec.displayOs} currentSpec={currentSpec?.displayOs} />
      </DataField>

      <Divider dataContent="Storage" />
      <DataField label="Storage tier">
        <ChangedPreviewer newSpec={newSpec.displayStorageTier} currentSpec={currentSpec?.displayStorageTier} />
      </DataField>
      <DataField label="OS Disk">
        <ChangedPreviewer newSpec={newSpec.osDisk} currentSpec={currentSpec?.osDisk} unit={'GB'} />
        &nbsp;<span>{(newSpec.additionalOsDisk || currentSpec?.additionalOsDisk) && '+'}</span>&nbsp;
        <ChangedPreviewer newSpec={newSpec.additionalOsDisk} currentSpec={currentSpec?.additionalOsDisk} unit={'GB'} />
      </DataField>
      {newSpec.dataDisk1Size && (
        <DataField label="Data disk 1">
          <ChangedPreviewer newSpec={newSpec.dataDisk1Size} currentSpec={currentSpec?.dataDisk1Size} unit={'GB'} />
        </DataField>
      )}
      {newSpec.dataDisk2Size && (
        <DataField label="Data disk 2">
          <ChangedPreviewer newSpec={newSpec.dataDisk2Size} currentSpec={currentSpec?.dataDisk2Size} unit={'GB'} />
        </DataField>
      )}
      <DataField label="Protection level">
        <ChangedPreviewer newSpec={newSpec.displayProtectionLevel} currentSpec={currentSpec?.displayProtectionLevel} />
      </DataField>

      {isPriceCalculator ? (
        ''
      ) : (
        <>
          <Divider dataContent="Network" />
          <DataField label="Environment">
            <ChangedPreviewer newSpec={newSpec.environment} currentSpec={currentSpec?.environment} />
          </DataField>
          <DataField label="Network Zone">
            <ChangedPreviewer newSpec={newSpec.displayNetworkZone} currentSpec={currentSpec?.displayNetworkZone} />
          </DataField>
        </>
      )}
      {newSpec.database && (
        <>
          <Divider dataContent="Database" />
          <DataField label="Database Engine">
            <ChangedPreviewer newSpec={newSpec.database.engine} currentSpec={currentSpec?.database?.engine} />
          </DataField>
          <Divider dataContent="Database detail" />
        </>
      )}

      {_.isEqual(newSpec.databaseDetails, currentSpec?.databaseDetails) || !currentSpec?.databaseDetails ? (
        <>
          {newSpec.database &&
            newSpec.databaseDetails &&
            newSpec.databaseDetails.map((detail, i) => {
              return (
                <div key={i}>
                  {i > 0 && newSpec.databaseDetails.length != i && <hr />}
                  {i > 0 && <div style={{ marginTop: '16px' }}></div>}
                  <DataField label="Database Name">
                    <span className={`database${i}.name`}>{detail.name}</span>
                  </DataField>
                  <DataField label="Data size">
                    <span className={`database${i}.dataSize`}>{detail.dataSize}</span>&nbsp;GB
                  </DataField>
                </div>
              );
            })}
        </>
      ) : (
        <>
          {currentSpec?.database &&
            currentSpec?.databaseDetails &&
            databaseDetailMain &&
            databaseDetailMain.map((_, i) => {
              return (
                <div key={i}>
                  {i > 0 && databaseDetailMain.length != i && <hr />}
                  {i > 0 && <div style={{ marginTop: '16px' }}></div>}
                  <DataField label="Database Name">
                    <ChangedPreviewer
                      newSpec={newSpec?.databaseDetails?.[i]?.name}
                      currentSpec={currentSpec?.databaseDetails?.[i]?.name}
                    />
                  </DataField>
                  <DataField label="Data size">
                    <ChangedPreviewer
                      newSpec={newSpec?.databaseDetails?.[i]?.dataSize}
                      currentSpec={currentSpec?.databaseDetails?.[i]?.dataSize}
                      unit={'GB'}
                    />
                  </DataField>
                </div>
              );
            })}
        </>
      )}

      {newSpec.maintenanceWindow && (
        <>
          <Divider dataContent="Maintenance Window" />
          <DataField label="Start day">
            <ChangedPreviewer
              newSpec={_.capitalize(newSpec.maintenanceWindow.day)}
              currentSpec={currentSpec?.maintenanceWindow != undefined ? _.capitalize(currentSpec?.maintenanceWindow.day) : ""}
            />
          </DataField>
          <DataField label="Start time">
            <ChangedPreviewer
              newSpec={newSpec.maintenanceWindow.startTime}
              currentSpec={currentSpec?.maintenanceWindow != undefined ? currentSpec?.maintenanceWindow.startTime : ""}
            />
          </DataField>
          <DataField label="Duration">
            <ChangedPreviewer
              newSpec={newSpec.maintenanceWindow.duration}
              currentSpec={currentSpec?.maintenanceWindow != undefined ? currentSpec?.maintenanceWindow.duration : ""
              }
              unit={'hours'}
            />
          </DataField>
        </>
      )}

      {Array.isArray(newSpec.webserver) ? (
        <>
          <Divider dataContent="Webserver" />
          {webserverMain &&
            webserverMain.map((_, i) => (
              <div key={i}>
                {i > 0 && webserverMain.length != i && <hr />}
                {i > 0 && <div style={{ marginTop: '16px' }}></div>}
                <DataField label="Application name">
                  <ChangedPreviewer
                    newSpec={newSpec?.webserver?.[i]?.applicationName || undefined}
                    currentSpec={currentSpec?.webserver?.[i]?.applicationName || undefined}
                    unit={''}
                  />
                </DataField>
                <DataField label="Read/Write users">
                  <ChangedPreviewer
                    newSpec={newSpec?.webserver?.[i]?.readWriteUsers || undefined}
                    currentSpec={currentSpec?.webserver?.[i]?.readWriteUsers || undefined}
                    unit={'GB'}
                  />
                </DataField>
                <DataField label="Read only users">
                  <ChangedPreviewer
                    newSpec={newSpec?.webserver?.[i]?.readOnlyUsers || undefined}
                    currentSpec={currentSpec?.webserver?.[i]?.readOnlyUsers || undefined}
                    unit={'GB'}
                  />
                </DataField>
              </div>
            ))}
        </>
      ) : (
        <>
          {newSpec.webserver && (
            <>
              <Divider dataContent="Webserver" />
              {(newSpec.webserver as WebServerSpecification).applicationName != undefined && (
                <DataField label="Application name">
                  <span data-field="webserver.applicationName">
                    {(newSpec.webserver as WebServerSpecification).applicationName}
                  </span>
                </DataField>
              )}

              {(newSpec.webserver as WebServerSpecification).readWriteUsers != undefined && (
                <DataField label="Read/Write users">
                  <span data-field="webserver.readWriteUsers">
                    {(newSpec.webserver as WebServerSpecification).readWriteUsers}
                  </span>
                </DataField>
              )}

              {(newSpec.webserver as WebServerSpecification).readOnlyUsers != undefined && (
                <DataField label="Read only users">
                  <span data-field="webserver.readOnlyUsers">
                    {(newSpec.webserver as WebServerSpecification).readOnlyUsers}
                  </span>
                </DataField>
              )}
            </>
          )}
        </>
      )}

      {currentAddOnService.length > 0 || newAddOnService.length > 0 && 
        <>
          <Divider dataContent="Add-on Service" />
          <DataField label="Add-on Service">
            <ul>
              {(currentAddOnService.length > newAddOnService.length ? currentAddOnService : newAddOnService).map(
                (service, i) => (
                  <li key={i}>
                    <ChangedPreviewer
                      newSpec={newAddOnService[i] && newAddOnService[i].display}
                      currentSpec={currentAddOnService[i] && currentAddOnService[i].display}
                    />
                  </li>
                ),
              )}
            </ul>
          </DataField>
        </>
      }
    </>
  );
};

const VmSpecificationContent: React.FC<{ spec: VmSpecification; isPriceCalculator: boolean }> = ({
  spec,
  isPriceCalculator,
}) => {
  return (
    <>
      <DataField label="vCPU">
        <span data-field="cpu">{spec.cpu}</span>&nbsp;cores
      </DataField>
      <DataField label="Memory">
        <span data-field="memory">{spec.memory}</span>&nbsp;GB
      </DataField>
      <DataField label="Operating system">
        <span data-field="os" data-value={spec.os}>
          {spec.displayOs}
        </span>
      </DataField>
      <Divider dataContent="Storage" />
      <DataField label="Storage tier">
        <span data-field="storage-tier" data-value={spec.storageTier}>
          {spec.displayStorageTier}
        </span>
      </DataField>
      <DataField label="OS Disk">
        <span data-field="osDisk">{spec.osDisk}</span>&nbsp;GB
        {spec.additionalOsDisk && spec.additionalOsDisk > 0 && (
          <>
            <span> + </span>
            <span data-field="additionalOsDisk">{spec.additionalOsDisk}</span>
            <span> GB</span>
          </>
        )}
      </DataField>
      {spec.dataDisk1Size && (
        <DataField label="Data disk 1">
          <span data-field="dataDisk1Size">{spec.dataDisk1Size}</span>&nbsp;GB
        </DataField>
      )}
      {spec.dataDisk2Size && (
        <DataField label="Data disk 2">
          <span data-field="dataDisk1Size">{spec.dataDisk2Size}</span>&nbsp;GB
        </DataField>
      )}
      <DataField label="Protection level">
        <span data-field="protectionLevel" data-value={spec.protectionLevel}>
          {spec.displayProtectionLevel}
        </span>
      </DataField>
      {isPriceCalculator ? (
        ''
      ) : (
        <>
          <Divider dataContent="Network" />
          <DataField label="Environment">
            <span data-field="environment" data-value={spec.environment}>
              {spec.displayEnvironment || spec.environment}
            </span>
          </DataField>
          <DataField label="Network Zone">
            <span data-field="networkZone" data-value={spec.networkZone}>
              {spec.displayNetworkZone}
            </span>
          </DataField>
        </>
      )}
      {spec.database && (
        <>
          <Divider dataContent="Database" />
          <DataField label="Database Engine">
            <span className="database.engine">{spec.database && spec.database.engine}</span>
          </DataField>
          <Divider dataContent="Database detail" />
        </>
      )}
      {spec.database &&
        spec.databaseDetails &&
        spec.databaseDetails.map((detail, i) => {
          return (
            <div key={i}>
              {i > 0 && spec.databaseDetails.length != i && <hr />}
              {i > 0 && <div style={{ marginTop: '16px' }}></div>}
              <DataField label="Database Name">
                <span className={`database${i}.name`}>{detail.name}</span>
              </DataField>
              <DataField label="Data size">
                <span className={`database${i}.dataSize`}>{detail.dataSize}</span>&nbsp;GB
              </DataField>
            </div>
          );
        })}
      {spec?.maintenanceWindow && (
        <>
          <Divider dataContent="Maintenance Window" />
          <DataField label="Start day">
            <span data-field="maintenanceWindow.day">{_.capitalize(spec.maintenanceWindow.day)}</span>
          </DataField>
          <DataField label="Start time">
            <span data-field="maintenanceWindow.startTime">{spec.maintenanceWindow.startTime}</span>
          </DataField>
          <DataField label="Duration">
            <span data-field="maintenanceWindow.duration">{spec.maintenanceWindow.duration} hours</span>
          </DataField>
        </>
      )}
      {Array.isArray(spec.webserver) ? (
        <>
          <Divider dataContent="Webserver" />
          {spec?.webserver?.map((server, i) => (
            <div key={i}>
              {i > 0 && spec.databaseDetails.length != i && <hr />}
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
            </div>
          ))}
        </>
      ) : (
        <>
          {spec.webserver && (
            <>
              <Divider dataContent="Webserver" />
              {(spec.webserver as WebServerSpecification).applicationName != undefined && (
                <DataField label="Application name">
                  <span data-field="webserver.applicationName">
                    {(spec.webserver as WebServerSpecification).applicationName}
                  </span>
                </DataField>
              )}

              {(spec.webserver as WebServerSpecification).readWriteUsers != undefined && (
                <DataField label="Read/Write users">
                  <span data-field="webserver.readWriteUsers">
                    {(spec.webserver as WebServerSpecification).readWriteUsers}
                  </span>
                </DataField>
              )}

              {(spec.webserver as WebServerSpecification).readOnlyUsers != undefined && (
                <DataField label="Read only users">
                  <span data-field="webserver.readOnlyUsers">
                    {(spec.webserver as WebServerSpecification).readOnlyUsers}
                  </span>
                </DataField>
              )}
            </>
          )}
        </>
      )}
      {Array.isArray(spec.addOnService) && (
        <>
          <Divider dataContent="Add-on Services" />
          <DataField label="Add-on Services">
            <ul>
              {spec.addOnService.map((service, index) => (
                <li key={`${index}-${service.value}`}>{service.display}</li>
              ))}
            </ul>
          </DataField>
        </>
      )}
    </>
  );
};

const ContainerSpecificationContent: React.FC<{ spec: ContainerSpecification; isPriceCalculator?: boolean }> = ({
  spec,
  isPriceCalculator,
}) => (
  <>
    <DataField label="Project name">
      <span data-field="namespace">{spec.namespace}</span>
    </DataField>

    <Divider dataContent="Resource quota" />
    <DataField label="vCPU">
      <span data-field="cpu">{spec.cpu}</span>&nbsp;cores
    </DataField>
    <DataField label="Memory">
      <span data-field="memory">{spec.memory}</span>&nbsp;GB
    </DataField>
    <DataField label="Storage">
      <span data-field="mainStorage">{spec.mainStorage}</span>&nbsp;GB
    </DataField>

    {isPriceCalculator ? (
      ''
    ) : (
      <>
        <Divider dataContent="Project membership" />
        <DataField label="Project members">
          <ul>
            {(spec.members || []).map((member) => (
              <li data-field="member" key={member}>
                PTTGRP/{member}
              </li>
            ))}
          </ul>
        </DataField>
      </>
    )}
  </>
);

const OtherSpecificationContent: React.FC<{ spec: OtherSpecification }> = ({ spec }) => (
  <DataField label="Message">
    <pre className="comment" data-field="message">
      {spec.message}
    </pre>
  </DataField>
);

interface SpecificationContentProps {
  ticketItem: TicketItemRequest;
  resource?: ResourceProperty;
}
export const SpecificationContent: React.FC<SpecificationContentProps> = (props) => {
  const { action, resource: itemResource, specification } = props.ticketItem;
  const [isPriceCalculator, setIsPriceCalculator] = React.useState(false);
  const location = useLocation();
  let spec = specification;

  console.log(itemResource)

  React.useEffect(() => {
    const pathname = location.pathname;
    setIsPriceCalculator(pathname.includes('price-calculator') ? true : false);
  }, [location]);

  if (action === 'delete') {
    if (itemResource && !_.isNumber(itemResource)) spec = itemResource.details;
    if (props.resource) spec = props.resource.details;
  }

  const hasUpdated =
    action === 'update' &&
    !_.isEmpty(spec) &&
    !_.isEmpty(itemResource) &&
    !_.isEqual(spec, (itemResource as ResourceProperty).details);

  console.log(hasUpdated)

  switch (props.ticketItem.resourceType) {
    case RESOURCE_TYPE_VM:
      return hasUpdated ? (
        <VmUpdatedSpecificationContent
          newSpec={spec}
          currentSpec={(itemResource as ResourceProperty).details}
          isPriceCalculator={isPriceCalculator}
        />
      ) : (
        <VmSpecificationContent spec={spec} isPriceCalculator={isPriceCalculator} />
      );
    case RESOURCE_TYPE_CONTAINER:
      return hasUpdated ? (
        <ContainerUpdatedSpecificationContent
          newSpec={spec}
          currentSpec={(itemResource as ResourceProperty).details}
          isPriceCalculator={isPriceCalculator}
        />
      ) : (
        <ContainerSpecificationContent spec={spec} isPriceCalculator={isPriceCalculator} />
      );
    case RESOURCE_TYPE_OTHER:
      return <OtherSpecificationContent spec={spec} />;
    default:
      return null;
  }
};

interface TicketItemNameProps {
  ticketItem: TicketItemRequest;
  resource?: ResourceProperty;
  isPlainText?: boolean;
}

export const TicketItemName: React.FC<TicketItemNameProps> = (props) => {
  const { ticketItem, resource, isPlainText } = props;

  let name = '',
    plainTextType = '',
    iconClass = '';

  switch (ticketItem.resourceType) {
    case RESOURCE_TYPE_VM:
      name = ticketItem.specification.name;
      plainTextType = 'Virtual machine - ';
      iconClass = 'fas fa-server';
      break;
    case RESOURCE_TYPE_CONTAINER:
      name = ticketItem.specification.namespace;
      plainTextType = 'Openshift project - ';
      iconClass = 'fas fa-cloud';
      break;
    case RESOURCE_TYPE_OTHER:
      const message = ticketItem.specification.message;
      name = message.slice(0, 100);
      if (message.length > 100) name += '...';
      iconClass = 'fas fa-magic';
      break;
  }

  if (resource) {
    name = resource.name;
  } else if (ticketItem.resource && !_.isNumber(ticketItem.resource)) {
    name = ticketItem.resource.name;
  }

  const dataAttributes = {
    'data-field': 'resourceType',
    'data-value': ticketItem.resourceType,
  };

  return (
    <>
      {isPlainText ? (
        <span {...dataAttributes}>{plainTextType}</span>
      ) : (
        <>
          <Icon className={iconClass} {...dataAttributes} />
          &nbsp;
        </>
      )}
      <span className="resource-name">{name}</span>
    </>
  );
};

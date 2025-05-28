import { Card, Notification } from 'bloomer';
import { Column } from 'bloomer/lib/grid/Column';
import { Columns } from 'bloomer/lib/grid/Columns';
import React, { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Cell, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';

import inventoryApi, { PowerState, PowerStateResponse } from '../../api/inventory';
import { DeferRender } from '../../components';
import BillingFilter from '../../components/billing-filter';

interface SelectedOptions {
  project?: string;
  dataCenter?: string;
  application?: string;
  resource?: string;
  jobCode?: string;
  startDate: Date;
  endDate: Date;
}

const CustomTick = (props: any) => {
  const { x, y, payload } = props;

  return (
    <g transform={`translate(${x},${y})`}>
      <text fontSize="10px" x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
        {payload.value ? payload.value.slice(2, 10) : ''}
      </text>
    </g>
  );
};

const Uptime: FC = () => {
  const dispatch = useDispatch();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({ startDate, endDate: new Date() });

  const OnSubmit = (value: any) => {
    setSelectedOptions(value);
  };

  const isSeleted =
    selectedOptions.application ||
    selectedOptions.dataCenter ||
    selectedOptions.jobCode ||
    selectedOptions.project ||
    selectedOptions.resource;

  const powerStateLoadder = React.useMemo(() => {
    if (!isSeleted) return;
    return inventoryApi(dispatch).powerState(selectedOptions);
  }, [isSeleted, dispatch, selectedOptions]);

  const getOptionLoader = React.useMemo(() => {
    return inventoryApi(dispatch).getOptions();
  }, [dispatch]);

  return (
    <>
      <DeferRender
        promise={getOptionLoader}
        render={(option) => (
          <Columns>
            <Column>
              <FilterSideBar OnSubmit={OnSubmit} option={option} />
            </Column>
            <Column className="is-three-quarters">
              {powerStateLoadder ? (
                <DeferRender
                  promise={powerStateLoadder}
                  render={(powerState) => <UptimeDetail powerStateLoader={powerState} />}
                />
              ) : (
                <Notification className="py-5" hasTextAlign="centered">
                  Please fill in the form to show graph.
                </Notification>
              )}
            </Column>
          </Columns>
        )}
      />
    </>
  );
};

interface UptimeProps {
  powerStateLoader: PowerStateResponse;
}

const UptimeDetail: React.FC<UptimeProps> = (props) => {
  const { powerStateLoader } = props;
  const [powerState, setPowerStateGraph] = useState<PowerStateResponse>([]);
  useEffect(() => {
    setPowerStateGraph(powerStateLoader);
  }, [powerStateLoader]);
  return (
    <>
      {powerState && powerState.length > 0 && (
        <Card>
          {powerState &&
            powerState.length &&
            powerState.map((item: PowerState, index: number) => {
              return (
                <ScatterChart
                  key={`power-state-${index}`}
                  width={950}
                  height={90}
                  margin={{ top: 10, right: 0, bottom: 35, left: 0 }}
                >
                  <XAxis type="category" dataKey="hour" interval={0} tick={<CustomTick />} />
                  <YAxis
                    type="number"
                    dataKey="index"
                    // name="sunday"
                    height={10}
                    width={120}
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name }}
                  />
                  <Scatter data={item.result} animationEasing="ease" shape="square">
                    {item.result.map((data, index) => {
                      return data.value < 22 ? (
                        <Cell key={index} fill="#FF2400" />
                      ) : (
                        <Cell key={index} fill="#347C2C" />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              );
            })}
        </Card>
      )}
    </>
  );
};

type FilterSideBarProps = {
  OnSubmit: (value: any) => void;
  option: any;
};

const FilterSideBar: React.FC<FilterSideBarProps> = (props) => {
  const { OnSubmit, option } = props;
  return (
    <>
      <BillingFilter onSubmit={OnSubmit} option={option} />
    </>
  );
};

export default Uptime;

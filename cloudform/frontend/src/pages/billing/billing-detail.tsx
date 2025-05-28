import { Button, Card, Column, Columns, Notification } from 'bloomer';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';

import inventoryApi, { PriceDetailSearchResponse } from '../../api/inventory';
import { TicketItemProperty } from '../../api/ticket';
import { CollapsibleBox } from '../../components';
import { DeferRender } from '../../components';
import BillingFilter from '../../components/billing-filter';
import { displayJSDateFile } from '../../formatter/date';
import { PriceDetailContent, PriceDetailHeader } from '../pricing/pricing';
import { download } from './export-csv';

interface PieChartData {
  name: string;
  value: number;
}

interface SelectedOptions {
  project?: string;
  dataCenter?: string;
  application?: string;
  resource?: string;
  jobCode?: string;
  tags?: string[];
  startDate: Date;
  endDate: Date;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = (props: any) => {
  let { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (!value) {
    return;
  }
  return (
    <text fontSize="10px" x={x} y={y} fill={'#BFBFBF'} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {name}
    </text>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, outerRadius, fill, name, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  if (!value) {
    return;
  }
  return (
    <>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text fontSize="12px" x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
        {name}
      </text>
    </>
  );
};

const BillingDetail: React.FC = () => {
  const dispatch = useDispatch();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({ startDate, endDate: new Date() });

  const priceDetailLoader = React.useMemo(() => {
    const isSeleted =
      selectedOptions.application ||
      selectedOptions.dataCenter ||
      selectedOptions.jobCode ||
      selectedOptions.project ||
      selectedOptions.resource ||
      selectedOptions.tags?.length;
    if (!isSeleted) return;
    return inventoryApi(dispatch).priceDetail(selectedOptions);
  }, [selectedOptions, dispatch]);

  const invenotoryLoader = React.useMemo(() => {
    const isSeleted =
      selectedOptions.application ||
      selectedOptions.dataCenter ||
      selectedOptions.jobCode ||
      selectedOptions.project ||
      selectedOptions.resource ||
      selectedOptions.tags?.length;
    if (!isSeleted) return;
    return inventoryApi(dispatch).inventory(selectedOptions);
  }, [selectedOptions, dispatch]);

  const resourceDetailsLoader = React.useMemo(() => {
    const isSeleted =
      selectedOptions.application ||
      selectedOptions.dataCenter ||
      selectedOptions.jobCode ||
      selectedOptions.project ||
      selectedOptions.resource ||
      selectedOptions.tags?.length;
    if (!isSeleted) return;
    return inventoryApi(dispatch).resourceDetails(selectedOptions);
  }, [selectedOptions, dispatch]);

  const getOptionLoader = React.useMemo(() => {
    return inventoryApi(dispatch).getOptions();
  }, [dispatch]);

  const OnSubmit = (value: any) => {
    setSelectedOptions(value);
  };

  return (
    <>
      <DeferRender
        promise={getOptionLoader}
        render={(getOptionLoader) => (
          <div className="container">
            <Columns>
              <Column>
                <FilterSideBar OnSubmit={OnSubmit} option={getOptionLoader} />
              </Column>
              <Column className="is-three-quarters">
                <DeferRender
                  promise={Promise.all([priceDetailLoader, invenotoryLoader, resourceDetailsLoader])}
                  render={([priceDetailLoader, invenotoryLoader, resourceDetailsLoader]) => (
                    <BillingDetailComponent
                      priceDetail={priceDetailLoader}
                      inventory={invenotoryLoader}
                      resourceDetails={resourceDetailsLoader}
                      selectedOptions={selectedOptions}
                    />
                  )}
                />
              </Column>
            </Columns>
          </div>
        )}
      />
    </>
  );
};

type AllPriceAllDayProps = {
  priceDetail: any;
  inventory: PriceDetailSearchResponse | undefined;
  resourceDetails: TicketItemProperty[] | undefined;
  selectedOptions: SelectedOptions;
};

const BillingDetailComponent: React.FC<AllPriceAllDayProps> = (props) => {
  const { priceDetail, inventory, resourceDetails, selectedOptions } = props;

  const [pieChartInventoryData, setPieChartInventoryData] = useState<PieChartData[]>([]);
  const [pieChartInnerData, setPieChartInnerData] = useState<PieChartData[]>([]);
  const [pieChartOuterData, setPieChartOuterData] = useState<PieChartData[]>([]);

  const [items, setItems] = React.useState<TicketItemProperty[]>([]);

  const summaryVm = () => {
    return pieChartInventoryData.map((r) => r.value).reduce((a, b) => a + b, 0);
  };

  useEffect(() => {
    if (!priceDetail) return;
    setPieChartInnerData(priceDetail.categories);
    setPieChartOuterData(priceDetail.priceDetails);
  }, [priceDetail]);

  useEffect(() => {
    setPieChartInventoryData([]);
    if (!inventory) return;
    inventory.map((item) =>
      setPieChartInventoryData((data) => [...data, { name: item.key, value: item.totalPrice.value }]),
    );
  }, [inventory]);

  useEffect(() => {
    if (!resourceDetails) return;
    setItems(resourceDetails);
  }, [resourceDetails]);

  const downloadCSVFile = () => {
    const start_date = displayJSDateFile(selectedOptions.startDate);
    const end_date = displayJSDateFile(selectedOptions.endDate);
    const fileName = `Resource detail ${getResponseSeleted(selectedOptions)} ${start_date}-${end_date}`;
    download(items, fileName);
  };

  const getResponseSeleted = (selectedOptions: any) => {
    if (selectedOptions.application) {
      return `Applicaton name ${selectedOptions.application}`;
    } else if (selectedOptions.dataCenter) {
      return `Data center name ${selectedOptions.dataCenter}`;
    } else if (selectedOptions.jobCode) {
      return `Job code ${selectedOptions.jobCode}`;
    } else if (selectedOptions.project) {
      return `Project name ${selectedOptions.project}`;
    } else if (selectedOptions.resource) {
      return `Resource name ${selectedOptions.resource}`;
    }
    return '';
  };

  return (
    <>
      {pieChartInventoryData.length > 0 ? (
        <Card>
          <ResponsiveContainer height={400}>
            <PieChart>
              <Pie
                data={pieChartInventoryData}
                dataKey="value"
                cx={220}
                cy={200}
                outerRadius={100}
                fill="#8884d8"
                minAngle={20}
                labelLine={false}
                label={renderActiveShape}
                isAnimationActive={false}
              />
              <Pie
                data={pieChartInnerData}
                dataKey="value"
                cx={700}
                cy={200}
                outerRadius={70}
                fill="#598ED3"
                labelLine={false}
                label={renderCustomizedLabel}
                isAnimationActive={false}
              />
              <Pie
                data={pieChartOuterData}
                dataKey="value"
                cx={700}
                cy={200}
                innerRadius={80}
                outerRadius={100}
                fill="#82ca9d"
                paddingAngle={1}
                labelLine={false}
                label={renderActiveShape}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="ml-6 has-text-link is-size-6 has-text-weight-bold">
            <p className="ml-6 mb-2">{`Summary Cost:  ${new Intl.NumberFormat().format(summaryVm())} THB`}</p>
          </div>
        </Card>
      ) : (
        <Notification className="py-5" hasTextAlign="centered">
          Please fill in the form to show detail.
        </Notification>
      )}
      <Card className="mt-4">
        {items &&
          items.map((item, i) => {
            return (
              item.estimatedPrice &&
              +item.estimatedPrice !== 0 && (
                <div className={'mt-2'} key={`dev-${i}`}>
                  <Card key={item.specification.name + i}>
                    <CollapsibleBox
                      headerType={({ isOpen }) => (
                        <PriceDetailHeader item={item} isOpen={isOpen} monthlyPrice={false} />
                      )}
                      isOpen={false}
                    >
                      <PriceDetailContent item={item} monthlyPrice={false} />
                    </CollapsibleBox>
                  </Card>
                </div>
              )
            );
          })}
        {items.length != 0 && (
          <Button
            style={{
              float: 'right',
              margin: '16px',
            }}
            type={'submit'}
            isColor={'primary'}
            onClick={downloadCSVFile}
          >
            Download CSV File
          </Button>
        )}
      </Card>
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

export default BillingDetail;

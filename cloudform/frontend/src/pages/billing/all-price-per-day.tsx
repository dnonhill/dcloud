import { Button, Card, Field as FieldBloomer, Label } from 'bloomer';
import { Column, Columns } from 'bloomer';
import { Form, Formik, FormikValues } from 'formik';
import { DateTime } from 'luxon';
import React, { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

import inventoryApi, { PricePerDayResponse } from '../../api/inventory';
import { DeferRender } from '../../components';
import { DatePicker } from '../../components/formik';
import { displayDate } from '../../formatter/date';

const CustomTooltip = (tooltip: TooltipProps) => {
  const { active, payload, label } = tooltip;
  if (active && payload) {
    return (
      <div>
        <p>{`${label}`}</p>
        <p>{`${payload ? payload[0].value : 0} THB`}</p>
      </div>
    );
  }

  return null;
};

const maxDate = DateTime.local().endOf('day').toJSDate();
const AllPricePerDay: FC = () => {
  const dispatch = useDispatch();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const [selectors, setSelectors] = useState({ startDate, endDate: new Date() });

  const OnSubmit = ({ startDate, endDate }: FormikValues) => {
    setSelectors({ startDate, endDate: DateTime.fromJSDate(endDate).endOf('day').toJSDate() });
  };

  const loader = React.useMemo(() => {
    return inventoryApi(dispatch).allPriceAllDay(selectors);
  }, [selectors, dispatch]);

  return (
    <DeferRender
      promise={loader}
      render={(allPriceAllDay) => (
        <AllPriceAllDayDetail OnSubmit={OnSubmit} selectors={selectors} allPriceAllDay={allPriceAllDay} />
      )}
    />
  );
};

interface Selectors {
  startDate: Date;
  endDate: Date;
}
type AllPriceAllDayProps = {
  OnSubmit: (value: FormikValues) => void;
  selectors: Selectors;
  allPriceAllDay: PricePerDayResponse[];
};

const AllPriceAllDayDetail: React.FC<AllPriceAllDayProps> = (props) => {
  const { OnSubmit, selectors, allPriceAllDay } = props;

  let [lineChart, setLineChart] = useState([{}]);
  const [maxPrice, setMaxPrice] = useState<number[]>([0]);

  useEffect(() => {
    setLineChart(
      allPriceAllDay.map((res) => {
        setMaxPrice((maxPrice) => [...maxPrice, +res.price.toFixed(0)]);
        return {
          date: displayDate(res.date),
          price: res.price.toFixed(2),
        };
      }),
    );
  }, [allPriceAllDay, selectors]);
  return (
    <>
      <div className="container">
        <Columns>
          <Column className="is-one-fifth">
            <Formik initialValues={selectors} onSubmit={OnSubmit}>
              <Form>
                <Column>
                  <FieldBloomer>
                    <Label>Start Date</Label>
                    <DatePicker placeholder="startDate" name="startDate" maxDate={maxDate} />
                  </FieldBloomer>
                </Column>
                <Column>
                  <FieldBloomer>
                    <Label>End Date</Label>
                    <DatePicker placeholder="endDate" name="endDate" maxDate={maxDate} />
                  </FieldBloomer>
                </Column>
                <Column>
                  <Button type={'submit'} isColor={'primary'}>
                    Submit
                  </Button>
                </Column>
              </Form>
            </Formik>
          </Column>
          <Column className="is-three-quarters">
            <Label hasTextAlign="centered" isSize="medium">
              Total Cost
            </Label>
            <Card>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  width={500}
                  height={500}
                  data={lineChart}
                  margin={{
                    top: 30,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    dataKey="price"
                    unit=" ฿"
                    domain={[Math.min(...maxPrice) > 0 ? Math.min(...maxPrice) : 0, Math.max(...maxPrice)]}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Legend formatter={() => <span>Summary Cost / day</span>} />
                  <Line type="monotone" dataKey="price" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Column>
        </Columns>
      </div>
    </>
  );
};
export default AllPricePerDay;

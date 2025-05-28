import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Column,
  Columns,
  MenuLabel,
} from 'bloomer';
import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import pricingApi, { CalculatePriceProperty, CalculatePriceResponse } from '../../api/pricing';
import { TicketItemProperty } from '../../api/ticket';
import { CollapsibleBox, CollapsibleIcon } from '../../components';
import { formatPrice, toMonthlyPrice } from '../../formatter/number';

interface PricingPanelProps {
  item: CalculatePriceProperty;
}

const PricingPanel: React.FC<PricingPanelProps> = ({ item }: PricingPanelProps): JSX.Element => {
  const api = pricingApi(useDispatch());
  const [items, setItems] = useState<TicketItemProperty[]>([]);

  const calculatePrice = () =>
    api.calculate(item).then((data: CalculatePriceResponse) => {
      setItems([
        {
          ...item,
          action: '',
          estimatedPrice: data.price,
          priceDetail: data.priceDetail,
        },
      ]);
    });

  return <TotalPricePanel items={items} calcFunction={calculatePrice} />;
};

export interface TotalPricePanelProps {
  items: TicketItemProperty[];
  calcFunction?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export const TotalPricePanel: React.FC<TotalPricePanelProps> = ({ items, calcFunction }: TotalPricePanelProps) => {
  // XXX: Number(item.estimatedPrice) is work around typescript and javascript type mismatch
  const totalPrice = items.reduce((acc, item) => {
    return acc + (Number(item.estimatedPrice) || 0);
  }, 0);
  const [expanded, setExpanded] = useState(false);

  const handleExpandAll = () => {
    setExpanded(true);
  };

  const handleCollapseAll = () => {
    setExpanded(false);
  };

  const handleCalcButton = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (calcFunction) {
      calcFunction(event);
    }
    handleExpandAll();
  };

  return (
    <>
      <Columns className={`${calcFunction ? 'mt-5' : 'mt-2'}`} isVCentered>
        <Column isSize={6}>
          {calcFunction && (
            <Button isColor="dark" onClick={handleCalcButton}>
              Calculate
            </Button>
          )}
        </Column>
        {totalPrice ? (
          <Column
            isSize={6}
            hasTextAlign="right"
            className="is-flex"
            style={{ alignItems: 'center', justifyContent: 'flex-end' }}
          >
            <Button
              className="is-text has-background-white has-text-link"
              style={{ textDecoration: 'none' }}
              onClick={handleExpandAll}
              disabled={expanded}
              data-testid="total-price-expand-all"
            >
              Expand All
            </Button>
            /
            <Button
              className="is-text has-background-white has-text-link"
              style={{ textDecoration: 'none' }}
              onClick={handleCollapseAll}
              disabled={!expanded}
              data-testid="total-price-collapse-all"
            >
              Collapse All
            </Button>
          </Column>
        ) : (
          <></>
        )}
      </Columns>
      {totalPrice ? (
        <Card className="mb-5">
          <CollapsibleBox
            headerType={({ isOpen }) => <PriceDetailHeader isOpen={isOpen} totalPrice={totalPrice} />}
            isOpen={expanded}
          >
            <CardContent data-testid="total-price-content">
              {items &&
                items.map((item, i) => {
                  return item.estimatedPrice ? (
                    +item.estimatedPrice !== 0 && (
                      <Card className="price-card" key={item.specification.name + i}>
                        <CollapsibleBox
                          headerType={({ isOpen }) => <PriceDetailHeader item={item} isOpen={isOpen} />}
                          isOpen={expanded}
                        >
                          <PriceDetailContent item={item} />
                        </CollapsibleBox>
                      </Card>
                    )
                  ) : (
                    <></>
                  );
                })}
            </CardContent>
            <Columns hasTextAlign="right" className="px-5 pb-4 is-size-5">
              <Column isSize={3} isOffset={7}>
                <strong>Estimated Monthly Cost: </strong>
              </Column>
              <Column isSize={2}>{toMonthlyPrice(totalPrice)} THB</Column>
            </Columns>
          </CollapsibleBox>
        </Card>
      ) : (
        <></>
      )}
    </>
  );
};

interface PriceDetailHeaderProps {
  item?: TicketItemProperty;
  isOpen: boolean;
  totalPrice?: number;
  monthlyPrice?: boolean;
}

export const PriceDetailHeader: React.FC<PriceDetailHeaderProps> = ({
  item,
  isOpen,
  totalPrice,
  monthlyPrice = true,
}: PriceDetailHeaderProps) => {
  const price = !item ? totalPrice : item.estimatedPrice;
  return (
    <CardHeader data-testid="price-detail-header">
      <CardHeaderTitle style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <span className="has-text-weight-bold has-text-primary">
          {!item ? 'Total Estimated Price' : item.specification.name || item.specification.namespace}
        </span>
        &nbsp;
        {!isOpen && (
          <span className="has-text-primary">
            {monthlyPrice ? `${toMonthlyPrice(price)} THB/Month` : `${formatPrice(price)} THB`}
          </span>
        )}
      </CardHeaderTitle>
      <CardHeaderIcon>
        <CollapsibleIcon isOpen={isOpen} />
      </CardHeaderIcon>
    </CardHeader>
  );
};

export const PriceDetailContent: React.FC<{ item: TicketItemProperty; monthlyPrice?: boolean }> = ({
  item,
  monthlyPrice = true,
}: {
  item: TicketItemProperty;
  monthlyPrice?: boolean;
}) => {
  return (
    <CardContent data-testid="price-detail-content">
      {item.application || item.jobCode ? (
        <>
          <Columns isGapless className="mb-2">
            <Column isSize={2}>
              <strong>Application</strong>
            </Column>
            <Column isSize={2}>{item.application}</Column>
            <Column isSize={2}>
              <strong>Job code</strong>
            </Column>
            <Column isSize={2}>{item.jobCode}</Column>
          </Columns>
        </>
      ) : (
        <></>
      )}
      {item.priceDetail &&
        item.priceDetail.map((cat) => (
          <React.Fragment key={cat.name + cat.total}>
            <hr style={{ margin: '1rem 0' }} />
            <MenuLabel>{cat.name}</MenuLabel>
            {cat.items.map((catItem) => (
              <Columns isGapless className="mb-2" key={catItem.display + catItem.price}>
                <Column>
                  <label>{catItem.display}</label>
                </Column>
                {catItem.hour ? (
                  <Column>
                    <label>{catItem.hour} Hrs.</label>
                  </Column>
                ) : (
                  <></>
                )}
                <Column hasTextAlign="right">
                  {monthlyPrice ? `${toMonthlyPrice(catItem.price)} THB/Month` : `${formatPrice(catItem.price)} THB`}
                </Column>
              </Columns>
            ))}
          </React.Fragment>
        ))}
      <hr style={{ margin: '1rem 0' }} />
      <Columns hasTextAlign="right">
        <Column isSize={2} isOffset={8}>
          <strong>{monthlyPrice ? 'Monthly Cost:' : 'Total:'} </strong>
        </Column>
        <Column isSize={2}>
          <strong>{monthlyPrice ? toMonthlyPrice(item.estimatedPrice) : formatPrice(item.estimatedPrice)} THB</strong>
        </Column>
      </Columns>
    </CardContent>
  );
};

export const EstimatedPrice: React.FC<{ item: TicketItemProperty }> = ({ item }: { item: TicketItemProperty }) => {
  if (typeof item.estimatedPrice === 'undefined') {
    return <></>;
  }

  return (
    <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal">
      Estimated price: {toMonthlyPrice(item.estimatedPrice)} THB/Month
    </span>
  );
};

export default PricingPanel;

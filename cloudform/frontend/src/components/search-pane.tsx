import { Button, Control, Field, Icon, Input } from 'bloomer';
import * as React from 'react';

interface SearchPaneProps {
  displayName: string;
  onSearch: (keyword: string) => void;
}

export const SearchPane: React.FC<SearchPaneProps> = (props) => {
  const [value, setValue] = React.useState('');
  const { onSearch } = props;

  const handleSearch = React.useMemo(
    () => (e: React.SyntheticEvent) => {
      e.preventDefault();
      onSearch(value);
    },
    [value, onSearch],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  };

  return (
    <form onSubmit={handleSearch} data-form="search">
      <Field hasAddons>
        <Control>
          <Input name="search-keyword" placeholder={props.displayName} onChange={onInputChange} />
        </Control>

        <Control>
          <Button onClick={handleSearch} type="submit" data-action="search">
            <Icon className="fa fa-search" />
          </Button>
        </Control>
      </Field>
    </form>
  );
};

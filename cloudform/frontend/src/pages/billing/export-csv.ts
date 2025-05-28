export const convertToCSV = (objArray: any) => {
  const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';
  const headers = array[0];
  for (let row = 0; row < array.length; row++) {
    var line = '';
    let obj_row = array[row];

    if (row != 0) {
      obj_row = setSameHeader(headers, array[row]);
    }

    for (var key in obj_row) {
      if (line != '') line += ',';
      line += obj_row[key];
    }

    str += line + '\r\n';
  }
  return str;
};

function setSameHeader(headers: any, data_row: any) {
  let new_obj = {};
  for (let header of Object.keys(headers)) {
    Object.assign(new_obj, { [header]: data_row[header] === undefined ? '' : data_row[header] });
  }
  return new_obj;
}

function exportCSVFile(headers: any, items: any, fileTitle: any) {
  if (headers) {
    items.unshift(headers);
  }
  const jsonObject = JSON.stringify(items);
  const csv = convertToCSV(jsonObject);
  const exportedFilenmae = fileTitle + '.csv' || 'export.csv';
  const blob = new Blob([csv], { type: 'data:text/csv;charset=utf-8;' });

  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else {
    var link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', exportedFilenmae);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const download = (itemsNotFormatted: any, fileTitle: any) => {
  var headers = {
    name: 'name',
    resourceType: 'resourceType',
  };
  console.log(itemsNotFormatted);

  let itemsFormatted: any = [];
  itemsNotFormatted.forEach((element: any) => {
    let obj = {};
    Object.assign(obj, { name: element['specification']['name'], resourceType: element['resourceType'] });
    element['priceDetail'].forEach((el: any) => {
      Object.assign(headers, { [el.name]: el['name'] });
      Object.assign(obj, { [el.name]: el['name'] });
      el['items'].forEach((els: any) => {
        Object.assign(headers, {
          [els.display]: els['display'],
          ['price-' + els['display']]: ['price-' + els['display']],
          ['hour-' + els['display']]: ['hour-' + els['display']],
        });
        Object.assign(obj, {
          [els.display]: els['display'],
          ['price-' + els['display']]: els['price'],
          ['hour-' + els['display']]: els['hour'],
        });
      });
    });
    itemsFormatted.push(obj);
  });
  exportCSVFile(headers, itemsFormatted, fileTitle);
};

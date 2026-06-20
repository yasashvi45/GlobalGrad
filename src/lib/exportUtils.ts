export const exportToCSV = (data: any[], filename: string) => {
   if (!data || data.length === 0) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'No data to export', type: 'error' } }));
      return;
   }
   try {
       // get all keys
       const keys = Array.from(new Set(data.flatMap(d => Object.keys(d))));
       const replacer = (key: string, value: any) => value === null || value === undefined ? '' : value;
       
       const csv = [
           keys.join(','),
           ...data.map(row => keys.map(fieldName => {
               let val = replacer(fieldName, row[fieldName]);
               // escape quotes
               if (typeof val === 'string') {
                   val = val.replace(/"/g, '""');
                   if (val.search(/("|,|\n)/g) >= 0) {
                       val = `"${val}"`;
                   }
               }
               return val;
           }).join(','))
       ].join('\r\n');

       const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
       const link = document.createElement('a');
       const url = URL.createObjectURL(blob);
       link.setAttribute('href', url);
       link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
       link.style.visibility = 'hidden';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Export successful' } }));
   } catch(e) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to export data', type: 'error' } }));
   }
};

export const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Export successful' } }));
};

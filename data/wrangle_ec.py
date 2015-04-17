import csv
import json

def init_data(fname):
    csv_filename = fname +'.csv'

    with open(csv_filename, 'rU') as csv_fh:
        # Parse as a CSV file.
        reader = csv.reader(csv_fh)

        # Skip the header line.
        header = next(reader, None)

        # Loop over the file.
        data = []

        for row in reader:
            months_index = range(1,len(header))
            months = []

            for i in months_index:
                if len(row[i]) > 0:
                    zhvi = row[i]
                else:
                    zhvi = -1

                month = {
                    'month': header[i],
                    'allhomes': int(zhvi),
                    '1br': -1,
                    '2br': -1,
                    '3br': -1,
                    '4br': -1
                }

                months.append(month)

            item = {
                'city': row[0],
                'months': months,
                'longitude': -1,
                'latitude': -1
            }

            data.append(item)

    return data 

def add_data(fname,df):
    next_csv = fname +'.csv'

    fobject = open(next_csv, 'rU')
    reader = csv.reader(fobject)
    header = next(reader, None)

    # Loop over the file.
    for row in reader:
        months_index = range(1,len(header))

        city_index = [i for i, j in enumerate(df) if j['city'] == row[0]]
        
        if len(city_index) > 0:
            city_index = city_index[0]

            for i in months_index:
                m_index = [k for k, j in enumerate(df[city_index]['months']) if j['month'] == header[i]]
                m_index = m_index[0]

                if len(row[i]) > 0:
                    br = row[i]
                else:
                    br = -1

                df[city_index]['months'][m_index][fname] = int(br)

    return df

# read data from CSV
data = init_data('allhomes')
files = ['1br','2br','3br','4br','5br']

for f in files:
    data = add_data(f,data)

data = add_coordinates('coordinates',data)

# save json file
with open('data.json', 'w') as outfile:
    json.dump(data, outfile)

# open json file
# from pandas.io.json import json_normalize

# with open('data.json') as data_file:    
#     d2 = pd.read_json(data_file)


# json_normalize(d2['months'])




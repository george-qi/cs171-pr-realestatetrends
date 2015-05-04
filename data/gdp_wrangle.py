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
			years_index = range(1,len(header))
			years = []

			for i in years_index:
				if len(row[i]) > 0:
					zhvi = row[i]
				else:
					zhvi = -1

				year = {
					'year': header[i],
					'gdp': int(zhvi),
				}

				years.append(year)

			item = {
				'state': row[0],
				'years': years,
			}

			data.append(item)

	return data 

# read data from CSV
data = init_data('state_gdp')

# save json file
with open('state_gdp.json', 'w') as outfile:
    json.dump(data, outfile)

# open json file
# from pandas.io.json import json_normalize

# with open('data.json') as data_file:    
#     d2 = pd.read_json(data_file)


# json_normalize(d2['months'])




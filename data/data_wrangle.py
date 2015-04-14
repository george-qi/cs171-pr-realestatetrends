import csv

csv_filename = 'allhomes.csv'

with open(csv_filename, 'r') as csv_fh:
	# Parse as a CSV file.
	reader = csv.reader(csv_fh)

	# Skip the header line.
	header = next(reader, None)

	# Loop over the file.
	data = []

	for row in reader:
		months_index = range(4,len(header))
		months = []

		for i in months_index:
			if len(row[i]) > 0:
				zhvi = row[i]
			else:
				zhvi = -1

			month = {
				'month': header[i],
				'allhomes': int(zhvi)
			}

			months.append(month)

		item = {
			'city': row[0],
			'state': row[1],
			'months': months
		}

		data.append(item)

next_csv = '1br.csv'

fobject = open(next_csv, 'r')
reader = csv.reader(fobject)
header = next(reader, None)

# Loop over the file.
for row in reader:
	months_index = range(4,len(header))

	city_index = [i for i, j in enumerate(data) if j['city'] == row[0]]
	
	if len(city_index) > 0:
		city_index = city_index[0]

		for i in months_index:
			m_index = [k for k, j in enumerate(data[city_index]['months']) if j['month'] == header[i]]
			m_index = m_index[0]

			if len(row[i]) > 0:
				br = row[i]
			else:
				br = -1

			data[city_index]['months'][m_index]['1br'] = int(br)


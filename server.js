const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const airports = [
    { code: 'LHR', city: 'London', country: 'UK', name: 'Heathrow' },
    { code: 'LGW', city: 'London', country: 'UK', name: 'Gatwick' },
    { code: 'STN', city: 'London', country: 'UK', name: 'Stansted' },
    { code: 'LTN', city: 'London', country: 'UK', name: 'Luton' },
    { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
    { code: 'ORY', city: 'Paris', country: 'France', name: 'Orly' },
    { code: 'JFK', city: 'New York', country: 'USA', name: 'John F. Kennedy' },
    { code: 'LGA', city: 'New York', country: 'USA', name: 'LaGuardia' },
    { code: 'EWR', city: 'New York', country: 'USA', name: 'Newark' },
    { code: 'LAX', city: 'Los Angeles', country: 'USA', name: 'Los Angeles Intl' },
    { code: 'ORD', city: 'Chicago', country: 'USA', name: "O'Hare" },
    { code: 'MDW', city: 'Chicago', country: 'USA', name: 'Midway' },
    { code: 'SFO', city: 'San Francisco', country: 'USA', name: 'San Francisco Intl' },
    { code: 'SEA', city: 'Seattle', country: 'USA', name: 'Seattle-Tacoma' },
    { code: 'MIA', city: 'Miami', country: 'USA', name: 'Miami Intl' },
    { code: 'FLL', city: 'Fort Lauderdale', country: 'USA', name: 'Fort Lauderdale' },
    { code: 'ATL', city: 'Atlanta', country: 'USA', name: 'Hartsfield-Jackson' },
    { code: 'DFW', city: 'Dallas', country: 'USA', name: 'Dallas/Fort Worth' },
    { code: 'DEN', city: 'Denver', country: 'USA', name: 'Denver Intl' },
    { code: 'BOS', city: 'Boston', country: 'USA', name: 'Logan' },
    { code: 'IAD', city: 'Washington', country: 'USA', name: 'Dulles' },
    { code: 'DCA', city: 'Washington', country: 'USA', name: 'Reagan National' },
    { code: 'PHX', city: 'Phoenix', country: 'USA', name: 'Sky Harbor' },
    { code: 'IAH', city: 'Houston', country: 'USA', name: 'George Bush Intercontinental' },
    { code: 'MSP', city: 'Minneapolis', country: 'USA', name: 'MSP' },
    { code: 'DTW', city: 'Detroit', country: 'USA', name: 'Metro Airport' },
    { code: 'PHL', city: 'Philadelphia', country: 'USA', name: 'Philadelphia Intl' },
    { code: 'SLC', city: 'Salt Lake City', country: 'USA', name: 'Salt Lake City Intl' },
    { code: 'DCA', city: 'Washington', country: 'USA', name: 'Reagan' },
    { code: 'SAN', city: 'San Diego', country: 'USA', name: 'San Diego Intl' },
    { code: 'TPA', city: 'Tampa', country: 'USA', name: 'Tampa Intl' },
    { code: 'PDX', city: 'Portland', country: 'USA', name: 'Portland Intl' },
    { code: 'HNL', city: 'Honolulu', country: 'USA', name: 'Daniel K. Inouye' },
    { code: 'ANC', city: 'Anchorage', country: 'USA', name: 'Ted Stevens' },
    { code: 'NRT', city: 'Tokyo', country: 'Japan', name: 'Narita' },
    { code: 'HND', city: 'Tokyo', country: 'Japan', name: 'Haneda' },
    { code: 'KIX', city: 'Osaka', country: 'Japan', name: 'Kansai' },
    { code: 'ITM', city: 'Osaka', country: 'Japan', name: 'Itami' },
    { code: 'FUK', city: 'Fukuoka', country: 'Japan', name: 'Fukuoka' },
    { code: 'CTS', city: 'Sapporo', country: 'Japan', name: 'New Chitose' },
    { code: 'PEK', city: 'Beijing', country: 'China', name: 'Capital Intl' },
    { code: 'PKX', city: 'Beijing', country: 'China', name: 'Daxing' },
    { code: 'PVG', city: 'Shanghai', country: 'China', name: 'Pudong' },
    { code: 'SHA', city: 'Shanghai', country: 'China', name: 'Hongqiao' },
    { code: 'CAN', city: 'Guangzhou', country: 'China', name: 'Baiyun' },
    { code: 'SZX', city: 'Shenzhen', country: 'China', name: 'Bao\'an' },
    { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', name: 'Chek Lap Kok' },
    { code: 'TPE', city: 'Taipei', country: 'Taiwan', name: 'Taoyuan' },
    { code: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon' },
    { code: 'GMP', city: 'Seoul', country: 'South Korea', name: 'Gimpo' },
    { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Changi' },
    { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi' },
    { code: 'DMK', city: 'Bangkok', country: 'Thailand', name: 'Don Mueang' },
    { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur Intl' },
    { code: 'CGK', city: 'Jakarta', country: 'Indonesia', name: 'Soekarno-Hatta' },
    { code: 'MNL', city: 'Manila', country: 'Philippines', name: 'Ninoy Aquino' },
    { code: 'DEL', city: 'Delhi', country: 'India', name: 'Indira Gandhi' },
    { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji' },
    { code: 'BLR', city: 'Bangalore', country: 'India', name: 'Kempegowda' },
    { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai Intl' },
    { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi' },
    { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhas Chandra Bose' },
    { code: 'COK', city: 'Kochi', country: 'India', name: 'Cochin Intl' },
    { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai Intl' },
    { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', name: 'Abu Dhabi Intl' },
    { code: 'DOH', city: 'Doha', country: 'Qatar', name: 'Hamad Intl' },
    { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', name: 'King Khalid' },
    { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', name: 'King Abdulaziz' },
    { code: 'IST', city: 'Istanbul', country: 'Turkey', name: 'Istanbul Airport' },
    { code: 'SAW', city: 'Istanbul', country: 'Turkey', name: 'Sabiha Gokcen' },
    { code: 'AYT', city: 'Antalya', country: 'Turkey', name: 'Antalya' },
    { code: 'FCO', city: 'Rome', country: 'Italy', name: 'Fiumicino' },
    { code: 'CIA', city: 'Rome', country: 'Italy', name: 'Ciampino' },
    { code: 'MXP', city: 'Milan', country: 'Italy', name: 'Malpensa' },
    { code: 'LIN', city: 'Milan', country: 'Italy', name: 'Linate' },
    { code: 'VCE', city: 'Venice', country: 'Italy', name: 'Marco Polo' },
    { code: 'NAP', city: 'Naples', country: 'Italy', name: 'Naples Intl' },
    { code: 'BCN', city: 'Barcelona', country: 'Spain', name: 'El Prat' },
    { code: 'MAD', city: 'Madrid', country: 'Spain', name: 'Barajas' },
    { code: 'AGP', city: 'Malaga', country: 'Spain', name: 'Costa del Sol' },
    { code: 'PMI', city: 'Palma de Mallorca', country: 'Spain', name: 'Son Sant Joan' },
    { code: 'TFS', city: 'Tenerife', country: 'Spain', name: 'Tenerife South' },
    { code: 'LPA', city: 'Gran Canaria', country: 'Spain', name: 'Gran Canaria' },
    { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt am Main' },
    { code: 'MUC', city: 'Munich', country: 'Germany', name: 'Munich' },
    { code: 'TXL', city: 'Berlin', country: 'Germany', name: 'Tegel' },
    { code: 'BER', city: 'Berlin', country: 'Germany', name: 'Brandenburg' },
    { code: 'DUS', city: 'Dusseldorf', country: 'Germany', name: 'Dusseldorf' },
    { code: 'HAM', city: 'Hamburg', country: 'Germany', name: 'Hamburg' },
    { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', name: 'Schiphol' },
    { code: 'BRU', city: 'Brussels', country: 'Belgium', name: 'Brussels' },
    { code: 'ZRH', city: 'Zurich', country: 'Switzerland', name: 'Zurich' },
    { code: 'GVA', city: 'Geneva', country: 'Switzerland', name: 'Geneva' },
    { code: 'VIE', city: 'Vienna', country: 'Austria', name: 'Vienna Intl' },
    { code: 'CPH', city: 'Copenhagen', country: 'Denmark', name: 'Copenhagen' },
    { code: 'ARN', city: 'Stockholm', country: 'Sweden', name: 'Arlanda' },
    { code: 'OSL', city: 'Oslo', country: 'Norway', name: 'Oslo Gardermoen' },
    { code: 'HEL', city: 'Helsinki', country: 'Finland', name: 'Vantaa' },
    { code: 'WAW', city: 'Warsaw', country: 'Poland', name: 'Chopin' },
    { code: 'PRG', city: 'Prague', country: 'Czech Republic', name: 'Vaclav Havel' },
    { code: 'BUD', city: 'Budapest', country: 'Hungary', name: 'Budapest Ferenc Liszt' },
    { code: 'OTP', city: 'Bucharest', country: 'Romania', name: 'Henri Coanda' },
    { code: 'ATH', city: 'Athens', country: 'Greece', name: 'Athens Intl' },
    { code: 'HER', city: 'Heraklion', country: 'Greece', name: 'Heraklion Intl' },
    { code: 'LIS', city: 'Lisbon', country: 'Portugal', name: 'Humberto Delgado' },
    { code: 'OPO', city: 'Porto', country: 'Portugal', name: 'Francisco Sa Carneiro' },
    { code: 'DUB', city: 'Dublin', country: 'Ireland', name: 'Dublin' },
    { code: 'SNN', city: 'Shannon', country: 'Ireland', name: 'Shannon' },
    { code: 'EDI', city: 'Edinburgh', country: 'UK', name: 'Edinburgh' },
    { code: 'MAN', city: 'Manchester', country: 'UK', name: 'Manchester' },
    { code: 'BHX', city: 'Birmingham', country: 'UK', name: 'Birmingham' },
    { code: 'GLA', city: 'Glasgow', country: 'UK', name: 'Glasgow' },
    { code: 'BRS', city: 'Bristol', country: 'UK', name: 'Bristol' },
    { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Kingsford Smith' },
    { code: 'MEL', city: 'Melbourne', country: 'Australia', name: 'Tullamarine' },
    { code: 'BNE', city: 'Brisbane', country: 'Australia', name: 'Brisbane' },
    { code: 'PER', city: 'Perth', country: 'Australia', name: 'Perth' },
    { code: 'ADL', city: 'Adelaide', country: 'Australia', name: 'Adelaide' },
    { code: 'AKL', city: 'Auckland', country: 'New Zealand', name: 'Auckland' },
    { code: 'WLG', city: 'Wellington', country: 'New Zealand', name: 'Wellington' },
    { code: 'CHC', city: 'Christchurch', country: 'New Zealand', name: 'Christchurch' },
    { code: 'YYZ', city: 'Toronto', country: 'Canada', name: 'Pearson' },
    { code: 'YVR', city: 'Vancouver', country: 'Canada', name: 'Vancouver Intl' },
    { code: 'YUL', city: 'Montreal', country: 'Canada', name: 'Trudeau' },
    { code: 'YOW', city: 'Ottawa', country: 'Canada', name: 'Ottawa' },
    { code: 'YYC', city: 'Calgary', country: 'Canada', name: 'Calgary' },
    { code: 'GRU', city: 'Sao Paulo', country: 'Brazil', name: 'Guarulhos' },
    { code: 'CGH', city: 'Sao Paulo', country: 'Brazil', name: 'Congonhas' },
    { code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', name: 'Galeao' },
    { code: 'SDU', city: 'Rio de Janeiro', country: 'Brazil', name: 'Santos Dumont' },
    { code: 'BSB', city: 'Brasilia', country: 'Brazil', name: 'Presidente Juscelino Kubitschek' },
    { code: 'CNF', city: 'Belo Horizonte', country: 'Brazil', name: 'Confins' },
    { code: 'MEX', city: 'Mexico City', country: 'Mexico', name: 'Benito Juarez' },
    { code: 'CUN', city: 'Cancun', country: 'Mexico', name: 'Cancun Intl' },
    { code: 'GDL', city: 'Guadalajara', country: 'Mexico', name: 'Miguel Hidalgo' },
    { code: 'MTY', city: 'Monterrey', country: 'Mexico', name: 'Monterrey' },
    { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', name: 'Ezeiza' },
    { code: 'AEP', city: 'Buenos Aires', country: 'Argentina', name: 'Aeroparque' },
    { code: 'SCL', city: 'Santiago', country: 'Chile', name: 'Arturo Merino Benitez' },
    { code: 'LIM', city: 'Lima', country: 'Peru', name: 'Jorge Chavez' },
    { code: 'BOG', city: 'Bogota', country: 'Colombia', name: 'El Dorado' },
    { code: 'PTY', city: 'Panama City', country: 'Panama', name: 'Tocumen' },
    { code: 'SJU', city: 'San Juan', country: 'Puerto Rico', name: 'Luis Munoz Marin' },
    { code: 'NAS', city: 'Nassau', country: 'Bahamas', name: 'Nassau' },
    { code: 'MBJ', city: 'Montego Bay', country: 'Jamaica', name: 'Sangster' },
    { code: 'PUJ', city: 'Punta Cana', country: 'Dominican Republic', name: 'Punta Cana' },
    { code: 'CPT', city: 'Cape Town', country: 'South Africa', name: 'Cape Town Intl' },
    { code: 'JNB', city: 'Johannesburg', country: 'South Africa', name: 'OR Tambo' },
    { code: 'CAI', city: 'Cairo', country: 'Egypt', name: 'Cairo Intl' },
    { code: 'CMN', city: 'Casablanca', country: 'Morocco', name: 'Mohammed V' },
    { code: 'NBO', city: 'Nairobi', country: 'Kenya', name: 'Jomo Kenyatta' },
    { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', name: 'Bole' },
    { code: 'LOS', city: 'Lagos', country: 'Nigeria', name: 'Murtala Muhammed' },
    { code: 'ACC', city: 'Accra', country: 'Ghana', name: 'Kotoka' },
    { code: 'MLE', city: 'Maldives', country: 'Maldives', name: 'Velana Intl' },
    { code: 'KTM', city: 'Kathmandu', country: 'Nepal', name: 'Tribhuvan' },
    { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', name: 'Bandaranaike' },
    { code: 'RGN', city: 'Yangon', country: 'Myanmar', name: 'Yangon Intl' },
    { code: 'PNH', city: 'Phnom Penh', country: 'Cambodia', name: 'Phnom Penh Intl' },
    { code: 'REP', city: 'Siem Reap', country: 'Cambodia', name: 'Siem Reap Intl' },
    { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', name: 'Tan Son Nhat' },
    { code: 'HAN', city: 'Hanoi', country: 'Vietnam', name: 'Noi Bai' },
    { code: 'DAD', city: 'Da Nang', country: 'Vietnam', name: 'Da Nang Intl' },
    { code: 'TAS', city: 'Tashkent', country: 'Uzbekistan', name: 'Islam Karimov' },
    { code: 'ALA', city: 'Almaty', country: 'Kazakhstan', name: 'Almaty Intl' },
    { code: 'TBS', city: 'Tbilisi', country: 'Georgia', name: 'Tbilisi Intl' },
    { code: 'EVN', city: 'Yerevan', country: 'Armenia', name: 'Zvartnots' },
    { code: 'GYD', city: 'Baku', country: 'Azerbaijan', name: 'Heydar Aliyev' },
    { code: 'KEF', city: 'Reykjavik', country: 'Iceland', name: 'Keflavik' },
    { code: 'FAO', city: 'Faro', country: 'Portugal', name: 'Faro' },
    { code: 'ACE', city: 'Lanzarote', country: 'Spain', name: 'Lanzarote' },
    { code: 'FUE', city: 'Fuerteventura', country: 'Spain', name: 'Fuerteventura' },
    { code: 'MLA', city: 'Malta', country: 'Malta', name: 'Malta Intl' },
    { code: 'LCA', city: 'Larnaca', country: 'Cyprus', name: 'Larnaca Intl' },
    { code: 'PFO', city: 'Paphos', country: 'Cyprus', name: 'Paphos Intl' },
    { code: 'TLL', city: 'Tallinn', country: 'Estonia', name: 'Tallinn' },
    { code: 'RIX', city: 'Riga', country: 'Latvia', name: 'Riga Intl' },
    { code: 'VNO', city: 'Vilnius', country: 'Lithuania', name: 'Vilnius' },
    { code: 'SOF', city: 'Sofia', country: 'Bulgaria', name: 'Sofia' },
    { code: 'BEG', city: 'Belgrade', country: 'Serbia', name: 'Nikola Tesla' },
    { code: 'ZAG', city: 'Zagreb', country: 'Croatia', name: 'Franjo Tudjman' },
    { code: 'SPU', city: 'Split', country: 'Croatia', name: 'Split' },
    { code: 'DBV', city: 'Dubrovnik', country: 'Croatia', name: 'Dubrovnik' },
    { code: 'LJU', city: 'Ljubljana', country: 'Slovenia', name: 'Ljubljana' },
    { code: 'SKP', city: 'Skopje', country: 'North Macedonia', name: 'Alexander the Great' },
    { code: 'TGD', city: 'Podgorica', country: 'Montenegro', name: 'Podgorica' },
    { code: 'TIA', city: 'Tirana', country: 'Albania', name: 'Tirana Intl' },
    { code: 'KIV', city: 'Kyiv', country: 'Ukraine', name: 'Boryspil' },
    { code: 'IEV', city: 'Kyiv', country: 'Ukraine', name: 'Zhuliany' },
    { code: 'ODS', city: 'Odessa', country: 'Ukraine', name: 'Odessa Intl' },
    { code: 'MSQ', city: 'Minsk', country: 'Belarus', name: 'Minsk National' },
    { code: 'KGD', city: 'Kaliningrad', country: 'Russia', name: 'Khrabrovo' },
    { code: 'LED', city: 'St Petersburg', country: 'Russia', name: 'Pulkovo' },
    { code: 'SVO', city: 'Moscow', country: 'Russia', name: 'Sheremetyevo' },
    { code: 'DME', city: 'Moscow', country: 'Russia', name: 'Domodedovo' },
    { code: 'VKO', city: 'Moscow', country: 'Russia', name: 'Vnukovo' },
    { code: 'OVB', city: 'Novosibirsk', country: 'Russia', name: 'Tolmachevo' },
    { code: 'VVO', city: 'Vladivostok', country: 'Russia', name: 'Vladivostok' },
    { code: 'YKS', city: 'Yakutsk', country: 'Russia', name: 'Yakutsk' },
    { code: 'BTK', city: 'Bratsk', country: 'Russia', name: 'Bratsk' },
    { code: 'IKT', city: 'Irkutsk', country: 'Russia', name: 'Irkutsk' },
    { code: 'KRR', city: 'Krasnodar', country: 'Russia', name: 'Pashkovsky' },
    { code: 'KRO', city: 'Kurgan', country: 'Russia', name: 'Kurgan' },
    { code: 'KZN', city: 'Kazan', country: 'Russia', name: 'Kazan' },
    { code: 'MRV', city: 'Mineralnye Vody', country: 'Russia', name: 'Mineralnye Vody' },
    { code: 'NBC', city: 'Naberezhnye Chelny', country: 'Russia', name: 'Begishevo' },
    { code: 'NJC', city: 'Nizhnevartovsk', country: 'Russia', name: 'Nizhnevartovsk' },
    { code: 'NUX', city: 'Novy Urengoy', country: 'Russia', name: 'Novy Urengoy' },
    { code: 'OMS', city: 'Omsk', country: 'Russia', name: 'Omsk' },
    { code: 'REN', city: 'Orenburg', country: 'Russia', name: 'Orenburg' },
    { code: 'SVX', city: 'Yekaterinburg', country: 'Russia', name: 'Koltsovo' },
    { code: 'TBW', city: 'Tambov', country: 'Russia', name: 'Tambov' },
    { code: 'TGK', city: 'Taganrog', country: 'Russia', name: 'Taganrog' },
    { code: 'TOF', city: 'Tomsk', country: 'Russia', name: 'Bogashevo' },
    { code: 'UUD', city: 'Ulan-Ude', country: 'Russia', name: 'Mukhino' },
    { code: 'UUS', city: 'Yuzhno-Sakhalinsk', country: 'Russia', name: 'Yuzhno-Sakhalinsk' },
    { code: 'VOG', city: 'Volgograd', country: 'Russia', name: 'Volgograd' },
    { code: 'VOZ', city: 'Voronezh', country: 'Russia', name: 'Voronezh' },
    { code: 'SCW', city: 'Syktyvkar', country: 'Russia', name: 'Syktyvkar' },
    { code: 'PKC', city: 'Petropavlovsk-Kamchatsky', country: 'Russia', name: 'Yelizovo' },
    { code: 'PES', city: 'Petrozavodsk', country: 'Russia', name: 'Petrozavodsk' },
    { code: 'PKV', city: 'Pskov', country: 'Russia', name: 'Pskov' },
    { code: 'PMM', city: 'Perm', country: 'Russia', name: 'Perm' },
    { code: 'ROV', city: 'Rostov-on-Don', country: 'Russia', name: 'Platov' },
    { code: 'SLY', city: 'Salekhard', country: 'Russia', name: 'Salekhard' },
    { code: 'SIP', city: 'Simferopol', country: 'Ukraine', name: 'Simferopol' },
    { code: 'AER', city: 'Sochi', country: 'Russia', name: 'Sochi' },
    { code: 'STW', city: 'Stavropol', country: 'Russia', name: 'Stavropol' },
    { code: 'SRP', city: 'Sovetsky', country: 'Russia', name: 'Sovetsky' },
    { code: 'SZR', city: 'Stavropol', country: 'Russia', name: 'Stavropol' },
    { code: 'TCP', city: 'Tampere', country: 'Finland', name: 'Tampere-Pirkkala' },
    { code: 'TKU', city: 'Turku', country: 'Finland', name: 'Turku' },
    { code: 'TMP', city: 'Tampere', country: 'Finland', name: 'Tampere-Pirkkala' },
    { code: 'OUL', city: 'Oulu', country: 'Finland', name: 'Oulu' },
    { code: 'RVN', city: 'Rovaniemi', country: 'Finland', name: 'Rovaniemi' },
    { code: 'IVL', city: 'Ivalo', country: 'Finland', name: 'Ivalo' },
    { code: 'KAO', city: 'Kuusamo', country: 'Finland', name: 'Kuusamo' },
    { code: 'KHU', city: 'Kuopio', country: 'Finland', name: 'Kuopio' },
    { code: 'JOE', city: 'Joensuu', country: 'Finland', name: 'Joensuu' },
    { code: 'KTT', city: 'Kittila', country: 'Finland', name: 'Kittila' },
    { code: 'SOT', city: 'Sodankyla', country: 'Finland', name: 'Sodankyla' },
    { code: 'ENF', city: 'Enontekio', country: 'Finland', name: 'Enontekio' },
    { code: 'LPP', city: 'Lappeenranta', country: 'Finland', name: 'Lappeenranta' },
    { code: 'MHQ', city: 'Mariehamn', country: 'Finland', name: 'Mariehamn' },
    { code: 'VAA', city: 'Vaasa', country: 'Finland', name: 'Vaasa' },
    { code: 'BOL', city: 'Bodrum', country: 'Turkey', name: 'Milas-Bodrum' },
    { code: 'ADB', city: 'Izmir', country: 'Turkey', name: 'Adnan Menderes' },
    { code: 'ESB', city: 'Ankara', country: 'Turkey', name: 'Esenboga' },
    { code: 'AYT', city: 'Antalya', country: 'Turkey', name: 'Antalya' },
    { code: 'DLM', city: 'Dalaman', country: 'Turkey', name: 'Dalaman' },
    { code: 'GZT', city: 'Gaziantep', country: 'Turkey', name: 'Oguzeli' },
    { code: 'ERZ', city: 'Erzurum', country: 'Turkey', name: 'Erzurum' },
    { code: 'TZX', city: 'Trabzon', country: 'Turkey', name: 'Trabzon' },
    { code: 'ANK', city: 'Ankara', country: 'Turkey', name: 'Ankara' },
    { code: 'ADB', city: 'Izmir', country: 'Turkey', name: 'Adnan Menderes' },
    { code: 'BJV', city: 'Bodrum', country: 'Turkey', name: 'Bodrum-Milas' },
    { code: 'KSH', city: 'Kermanshah', country: 'Iran', name: 'Kermanshah' },
    { code: 'THR', city: 'Tehran', country: 'Iran', name: 'Mehrabad' },
    { code: 'IKA', city: 'Tehran', country: 'Iran', name: 'Imam Khomeini' },
    { code: 'MHD', city: 'Mashhad', country: 'Iran', name: 'Mashhad' },
    { code: 'SYZ', city: 'Shiraz', country: 'Iran', name: 'Shiraz Intl' },
    { code: 'AWZ', city: 'Ahvaz', country: 'Iran', name: 'Ahvaz' },
    { code: 'IFN', city: 'Isfahan', country: 'Iran', name: 'Isfahan' },
    { code: 'TBZ', city: 'Tabriz', country: 'Iran', name: 'Tabriz' },
    { code: 'KHI', city: 'Karachi', country: 'Pakistan', name: 'Jinnah Intl' },
    { code: 'LHE', city: 'Lahore', country: 'Pakistan', name: 'Allama Iqbal' },
    { code: 'ISB', city: 'Islamabad', country: 'Pakistan', name: 'Islamabad Intl' },
    { code: 'PEW', city: 'Peshawar', country: 'Pakistan', name: 'Peshawar Intl' },
    { code: 'UET', city: 'Quetta', country: 'Pakistan', name: 'Quetta Intl' },
    { code: 'SKT', city: 'Sialkot', country: 'Pakistan', name: 'Sialkot Intl' },
    { code: 'RWP', city: 'Rawalpindi', country: 'Pakistan', name: 'Chaklala' },
    { code: 'DPS', city: 'Bali', country: 'Indonesia', name: 'Ngurah Rai' },
    { code: 'SUB', city: 'Surabaya', country: 'Indonesia', name: 'Juanda' },
    { code: 'Medan', city: 'Medan', country: 'Indonesia', name: 'Polonia' },
    { code: 'SOQ', city: 'Sorong', country: 'Indonesia', name: 'Sorong' },
    { code: 'DJJ', city: 'Jayapura', country: 'Indonesia', name: 'Sentani' },
    { code: 'MLG', city: 'Malang', country: 'Indonesia', name: 'Abdul Rachman Saleh' },
    { code: 'BDO', city: 'Bandung', country: 'Indonesia', name: 'Husein Sastranegara' },
    { code: 'PKU', city: 'Pekanbaru', country: 'Indonesia', name: 'Sultan Syarif Kasim II' },
    { code: 'PLM', city: 'Palembang', country: 'Indonesia', name: 'Sultan Mahmud Badaruddin II' },
    { code: 'BPN', city: 'Balikpapan', country: 'Indonesia', name: 'Sepinggan' },
    { code: 'UPG', city: 'Makassar', country: 'Indonesia', name: 'Sultan Hasanuddin' },
    { code: 'BIM', city: 'Bima', country: 'Indonesia', name: 'Bima' },
    { code: 'MDC', city: 'Manado', country: 'Indonesia', name: 'Sam Ratulangi' },
    { code: 'KOE', city: 'Kupang', country: 'Indonesia', name: 'El Tari' },
    { code: 'BMU', city: 'Bima', country: 'Indonesia', name: 'Muhammad Salahuddin' },
    { code: 'WGP', city: 'Waingapu', country: 'Indonesia', name: 'Mau Hau' },
    { code: 'LOP', city: 'Lombok', country: 'Indonesia', name: 'Lombok Intl' },
    { code: 'SOC', city: 'Solo', country: 'Indonesia', name: 'Adi Sumarmo' },
    { code: 'YIA', city: 'Yogyakarta', country: 'Indonesia', name: 'Yogyakarta Intl' },
    { code: 'JOG', city: 'Yogyakarta', country: 'Indonesia', name: 'Adisucipto' },
    { code: 'SRG', city: 'Semarang', country: 'Indonesia', name: 'Achmad Yani' },
    { code: 'BDJ', city: 'Banjarmasin', country: 'Indonesia', name: 'Syamsudin Noor' },
    { code: 'PKN', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PSU', city: 'Pangkal Pinang', country: 'Indonesia', name: 'Depati Amir' },
    { code: 'HMS', city: 'Hermansyah', country: 'Indonesia', name: 'Hermansyah' },
    { code: 'NTB', city: 'Sumbawa', country: 'Indonesia', name: 'Sumbawa' },
    { code: 'TMC', city: 'Tambolaka', country: 'Indonesia', name: 'Tambolaka' },
    { code: 'LBJ', city: 'Labuan Bajo', country: 'Indonesia', name: 'Komodo' },
    { code: 'KOE', city: 'Kupang', country: 'Indonesia', name: 'El Tari' },
    { code: 'MKQ', city: 'Merauke', country: 'Indonesia', name: 'Mopah' },
    { code: 'TIM', city: 'Timika', country: 'Indonesia', name: 'Mozes Kilangin' },
    { code: 'BXB', city: 'Babo', country: 'Indonesia', name: 'Babo' },
    { code: 'WNI', city: 'Wakatobi', country: 'Indonesia', name: 'Matahora' },
    { code: 'KWB', city: 'Karimunjawa', country: 'Indonesia', name: 'Karimunjawa' },
    { code: 'CBN', city: 'Cirebon', country: 'Indonesia', name: 'Cakrabhuwana' },
    { code: 'TSY', city: 'Tasikmalaya', country: 'Indonesia', name: 'Tasikmalaya' },
    { code: 'BTH', city: 'Batam', country: 'Indonesia', name: 'Hang Nadim' },
    { code: 'TNJ', city: 'Tanjung Pinang', country: 'Indonesia', name: 'Kijang' },
    { code: 'SIQ', city: 'Singkawang', country: 'Indonesia', name: 'Supadio' },
    { code: 'PNK', city: 'Pontianak', country: 'Indonesia', name: 'Supadio' },
    { code: 'PSJ', city: 'Poso', country: 'Indonesia', name: 'Kasiguncu' },
    { code: 'TTE', city: 'Ternate', country: 'Indonesia', name: 'Sultan Babullah' },
    { code: 'LUV', city: 'Langgur', country: 'Indonesia', name: 'Dumatubin' },
    { code: 'WBB', city: 'Buru', country: 'Indonesia', name: 'Namrole' },
    { code: 'NAM', city: 'Namrole', country: 'Indonesia', name: 'Namrole' },
    { code: 'NRE', city: 'Namrole', country: 'Indonesia', name: 'Namrole' },
    { code: 'NPO', city: 'Nanga Pinoh', country: 'Indonesia', name: 'Nanga Pinoh' },
    { code: 'PCU', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PDG', city: 'Padang', country: 'Indonesia', name: 'Minangkabau' },
    { code: 'BKS', city: 'Bengkulu', country: 'Indonesia', name: 'Fatmawati Soekarno' },
    { code: 'PLB', city: 'Palembang', country: 'Indonesia', name: 'Palembang' },
    { code: 'TJQ', city: 'Tanjung Pandan', country: 'Indonesia', name: 'Buluh Tumbang' },
    { code: 'PGK', city: 'Pangkal Pinang', country: 'Indonesia', name: 'Depati Amir' },
    { code: 'PKY', city: 'Palangkaraya', country: 'Indonesia', name: 'Tjilik Riwut' },
    { code: 'PKN', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PNO', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PBU', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PJT', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PKY', city: 'Palangkaraya', country: 'Indonesia', name: 'Tjilik Riwut' },
    { code: 'PKU', city: 'Pekanbaru', country: 'Indonesia', name: 'Sultan Syarif Kasim II' },
    { code: 'PLM', city: 'Palembang', country: 'Indonesia', name: 'Sultan Mahmud Badaruddin II' },
    { code: 'PNK', city: 'Pontianak', country: 'Indonesia', name: 'Supadio' },
    { code: 'PSJ', city: 'Poso', country: 'Indonesia', name: 'Kasiguncu' },
    { code: 'PSU', city: 'Pangkal Pinang', country: 'Indonesia', name: 'Depati Amir' },
    { code: 'PTK', city: 'Pekanbaru', country: 'Indonesia', name: 'Sultan Syarif Kasim II' },
    { code: 'PWL', city: 'Palembang', country: 'Indonesia', name: 'Sultan Mahmud Badaruddin II' },
    { code: 'SOC', city: 'Solo', country: 'Indonesia', name: 'Adi Sumarmo' },
    { code: 'SRG', city: 'Semarang', country: 'Indonesia', name: 'Achmad Yani' },
    { code: 'SUB', city: 'Surabaya', country: 'Indonesia', name: 'Juanda' },
    { code: 'TJQ', city: 'Tanjung Pandan', country: 'Indonesia', name: 'Buluh Tumbang' },
    { code: 'TMC', city: 'Tambolaka', country: 'Indonesia', name: 'Tambolaka' },
    { code: 'TTE', city: 'Ternate', country: 'Indonesia', name: 'Sultan Babullah' },
    { code: 'UPG', city: 'Makassar', country: 'Indonesia', name: 'Sultan Hasanuddin' },
    { code: 'WGP', city: 'Waingapu', country: 'Indonesia', name: 'Mau Hau' },
    { code: 'WNI', city: 'Wakatobi', country: 'Indonesia', name: 'Matahora' },
    { code: 'YIA', city: 'Yogyakarta', country: 'Indonesia', name: 'Yogyakarta Intl' },
    { code: 'BDJ', city: 'Banjarmasin', country: 'Indonesia', name: 'Syamsudin Noor' },
    { code: 'BIM', city: 'Bima', country: 'Indonesia', name: 'Muhammad Salahuddin' },
    { code: 'BMU', city: 'Bima', country: 'Indonesia', name: 'Muhammad Salahuddin' },
    { code: 'BPN', city: 'Balikpapan', country: 'Indonesia', name: 'Sepinggan' },
    { code: 'BTH', city: 'Batam', country: 'Indonesia', name: 'Hang Nadim' },
    { code: 'DJJ', city: 'Jayapura', country: 'Indonesia', name: 'Sentani' },
    { code: 'DPS', city: 'Bali', country: 'Indonesia', name: 'Ngurah Rai' },
    { code: 'HMS', city: 'Hermansyah', country: 'Indonesia', name: 'Hermansyah' },
    { code: 'KOE', city: 'Kupang', country: 'Indonesia', name: 'El Tari' },
    { code: 'KWB', city: 'Karimunjawa', country: 'Indonesia', name: 'Karimunjawa' },
    { code: 'LBJ', city: 'Labuan Bajo', country: 'Indonesia', name: 'Komodo' },
    { code: 'LOP', city: 'Lombok', country: 'Indonesia', name: 'Lombok Intl' },
    { code: 'MDC', city: 'Manado', country: 'Indonesia', name: 'Sam Ratulangi' },
    { code: 'MLG', city: 'Malang', country: 'Indonesia', name: 'Abdul Rachman Saleh' },
    { code: 'MKQ', city: 'Merauke', country: 'Indonesia', name: 'Mopah' },
    { code: 'NAM', city: 'Namrole', country: 'Indonesia', name: 'Namrole' },
    { code: 'NPO', city: 'Nanga Pinoh', country: 'Indonesia', name: 'Nanga Pinoh' },
    { code: 'NRE', city: 'Namrole', country: 'Indonesia', name: 'Namrole' },
    { code: 'NTB', city: 'Sumbawa', country: 'Indonesia', name: 'Sumbawa' },
    { code: 'PCU', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PDG', city: 'Padang', country: 'Indonesia', name: 'Minangkabau' },
    { code: 'PGK', city: 'Pangkal Pinang', country: 'Indonesia', name: 'Depati Amir' },
    { code: 'PKY', city: 'Palangkaraya', country: 'Indonesia', name: 'Tjilik Riwut' },
    { code: 'PKN', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PNO', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PBU', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PJT', city: 'Pangkalan Bun', country: 'Indonesia', name: 'Iskandar' },
    { code: 'PKY', city: 'Palangkaraya', country: 'Indonesia', name: 'Tjilik Riwut' },
    { code: 'PKU', city: 'Pekanbaru', country: 'Indonesia', name: 'Sultan Syarif Kasim II' },
    { code: 'PLM', city: 'Palembang', country: 'Indonesia', name: 'Sultan Mahmud Badaruddin II' },
    { code: 'PNK', city: 'Pontianak', country: 'Indonesia', name: 'Supadio' },
    { code: 'PSJ', city: 'Poso', country: 'Indonesia', name: 'Kasiguncu' },
    { code: 'PSU', city: 'Pangkal Pinang', country: 'Indonesia', name: 'Depati Amir' },
    { code: 'PTK', city: 'Pekanbaru', country: 'Indonesia', name: 'Sultan Syarif Kasim II' },
    { code: 'PWL', city: 'Palembang', country: 'Indonesia', name: 'Sultan Mahmud Badaruddin II' },
    { code: 'SOC', city: 'Solo', country: 'Indonesia', name: 'Adi Sumarmo' },
    { code: 'SRG', city: 'Semarang', country: 'Indonesia', name: 'Achmad Yani' },
    { code: 'SUB', city: 'Surabaya', country: 'Indonesia', name: 'Juanda' },
    { code: 'TJQ', city: 'Tanjung Pandan', country: 'Indonesia', name: 'Buluh Tumbang' },
    { code: 'TMC', city: 'Tambolaka', country: 'Indonesia', name: 'Tambolaka' },
    { code: 'TTE', city: 'Ternate', country: 'Indonesia', name: 'Sultan Babullah' },
    { code: 'UPG', city: 'Makassar', country: 'Indonesia', name: 'Sultan Hasanuddin' },
    { code: 'WGP', city: 'Waingapu', country: 'Indonesia', name: 'Mau Hau' },
    { code: 'WNI', city: 'Wakatobi', country: 'Indonesia', name: 'Matahora' },
    { code: 'YIA', city: 'Yogyakarta', country: 'Indonesia', name: 'Yogyakarta Intl' },
];

let browserInstance = null;

async function getBrowser() {
    if (!browserInstance || !browserInstance.connected) {
        browserInstance = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });
    }
    return browserInstance;
}

async function scrapeGoogleFlights(origin, destination, date) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 900 });

        const url = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        await new Promise(r => setTimeout(r, 4000));

        const flights = await page.evaluate(() => {
            const results = [];
            const lists = document.querySelectorAll('li');
            lists.forEach(li => {
                const text = li.innerText;
                const priceMatch = text.match(/\$(\d[\d,]*)/);
                if (!priceMatch) return;
                const price = parseInt(priceMatch[1].replace(/,/g, ''));
                if (!price || price < 10 || price > 50000) return;
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                let airline = '';
                let times = '';
                let duration = '';
                let stops = '';
                for (const line of lines) {
                    if (/^\d{1,2}:\d{2}\s*(AM|PM)?\s*[–-]\s*\d{1,2}:\d{2}/.test(line)) {
                        times = line;
                    } else if (/^\d+\s*h\s*\d*\s*m?$/.test(line) || /^\d+h/.test(line)) {
                        duration = line;
                    } else if (/^Nonstop$|^Direct$|^\d+\s*stop/i.test(line)) {
                        stops = line;
                    } else if (line.length > 3 && line.length < 40 && !/^\$/.test(line) && !/^\d/.test(line) && !/stop/i.test(line) && !/h$/.test(line)) {
                        if (!airline) airline = line;
                    }
                }
                if (times || airline) {
                    results.push({ price, airline, times, duration, stops });
                }
            });
            if (results.length === 0) {
                const priceElements = document.querySelectorAll('[data-value]');
                priceElements.forEach(el => {
                    const price = parseInt(el.getAttribute('data-value'));
                    if (price && price > 0 && price < 50000) {
                        results.push({ price, airline: '', times: '', duration: '', stops: '' });
                    }
                });
            }
            return results;
        });

        return flights;
    } catch (err) {
        console.error('Scrape error:', err.message);
        return [];
    } finally {
        await page.close();
    }
}

app.get('/api/airports', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q || q.length < 1) return res.json([]);

    const results = airports.filter(a =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    ).slice(0, 8);

    res.json(results);
});

app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body;
    if (!origin || !destination || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const flights = await scrapeGoogleFlights(origin, destination, date);
        if (flights.length === 0) {
            return res.json({ flights: [], cheapest: null, average: null, total: 0 });
        }
        const sorted = [...flights].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0].price;
        const average = Math.round(sorted.reduce((sum, f) => sum + f.price, 0) / sorted.length);
        res.json({ flights: sorted.slice(0, 20), cheapest, average, total: sorted.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

process.on('SIGTERM', async () => {
    if (browserInstance) await browserInstance.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Flight tracker server running on port ${PORT}`);
});

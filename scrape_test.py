import urllib.request
import urllib.parse
import re

search_term = "Aglaonema Red Star"
url = f'https://commons.wikimedia.org/w/index.php?search={urllib.parse.quote(search_term)}&title=Special:MediaSearch&type=image'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    match = re.search(r'src="(https://upload\.wikimedia\.org/wikipedia/commons/thumb/[^"]+)"', html)
    if match:
        print('Found:', match.group(1))
    else:
        print('No image found')
except Exception as e:
    print('Error:', e)

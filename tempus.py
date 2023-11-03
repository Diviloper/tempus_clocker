import random
import subprocess
import sys
import time
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Tuple

try:
    import requests
except ImportError:
    print("Aquest programa necessita el mòdul 'requests' per funcionar.")
    install = input("Vols instal·lar-lo? [S/n] ").lower() != 'n'
    if install:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", 'requests'])
            import requests

            print("El mòdul 'requests' s'ha instal·lat correctament.")
        except subprocess.CalledProcessError:
            print("No s'ha pogut instal·lar el mòdul 'requests'.")
            print("Instal·la'l manualment i torna a executar el programa.")
            sys.exit(1)
        except ImportError:
            print("No s'ha pogut instal·lar el mòdul 'requests'.")
            print("Instal·la'l manualment i torna a executar el programa.")
            sys.exit(1)
    else:
        print("Instal·la'l manualment i torna a executar el programa.")
        sys.exit(1)

try:
    import browser_cookie3
except ImportError:
    print("Aquest programa utilitza el mòdul 'browser_cookie3' per a obtenir les cookies necessaries automàticament.")
    print("Si no vols instal·lar-lo, les hauràs d'obtenir i introduir manualment, però podràs fitxar igualment.")
    install = input("Vols instal·lar-lo? [S/n] ").lower() != 'n'
    if install:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", 'browser_cookie3'])
            import browser_cookie3

            print("El mòdul 'browser_cookie3' s'ha instal·lat correctament.")
        except subprocess.CalledProcessError:
            print("No s'ha pogut instal·lar el mòdul 'browser_cookie3'.")
            print("Es procedirà sense l'obtenció automàtica de cookies.")
            browser_cookie3 = None
        except ImportError:
            print("No s'ha pogut instal·lar el mòdul 'browser_cookie3'.")
            print("Es procedirà sense l'obtenció automàtica de cookies.")
            browser_cookie3 = None
    else:
        browser_cookie3 = None

arts = [
    r"""
 _____   _       _ _                         
(____ \ (_)     (_) |                        
 _   \ \ _ _   _ _| | ___  ____   ____  ____ 
| |   | | | | | | | |/ _ \|  _ \ / _  )/ ___)
| |__/ /| |\ V /| | | |_| | | | ( (/ /| |    
|_____/ |_| \_/ |_|_|\___/| ||_/ \____)_|    
                          |_|                
    """,
    r"""
  _____  _       _ _                       
 |  __ \(_)     (_) |                      
 | |  | |___   ___| | ___  _ __   ___ _ __ 
 | |  | | \ \ / / | |/ _ \| '_ \ / _ \ '__|
 | |__| | |\ V /| | | (_) | |_) |  __/ |   
 |_____/|_| \_/ |_|_|\___/| .__/ \___|_|   
                          | |              
                          |_|    
    """,
    r"""
  ____           __     __            _       U  ___ u  ____   U _____ u   ____     
 |  _"\    ___   \ \   /"/u  ___     |"|       \/"_ \/U|  _"\ u\| ___"|/U |  _"\ u  
/| | | |  |_"_|   \ \ / //  |_"_|  U | | u     | | | |\| |_) |/ |  _|"   \| |_) |/  
U| |_| |\  | |    /\ V /_,-. | |    \| |/__.-,_| |_| | |  __/   | |___    |  _ <    
 |____/ uU/| |\u U  \_/-(_/U/| |\u   |_____|\_)-\___/  |_|      |_____|   |_| \_\   
  |||_.-,_|___|_,-.//   .-,_|___|_,-.//  \\      \\    ||>>_    <<   >>   //   \\_  
 (__)_)\_)-' '-(_/(__)   \_)-' '-(_/(_")("_)    (__)  (__)__)  (__) (__) (__)  (__) 
    """,
    r"""
 ______  _________         _________ _        _______  _______  _______  _______ 
(  __  \ \__   __/|\     /|\__   __/( \      (  ___  )(  ____ )(  ____ \(  ____ )
| (  \  )   ) (   | )   ( |   ) (   | (      | (   ) || (    )|| (    \/| (    )|
| |   ) |   | |   | |   | |   | |   | |      | |   | || (____)|| (__    | (____)|
| |   | |   | |   ( (   ) )   | |   | |      | |   | ||  _____)|  __)   |     __)
| |   ) |   | |    \ \_/ /    | |   | |      | |   | || (      | (      | (\ (   
| (__/  )___) (___  \   /  ___) (___| (____/\| (___) || )      | (____/\| ) \ \__
(______/ \_______/   \_/   \_______/(_______/(_______)|/       (_______/|/   \__/
    """,
    r"""
 (                                    
 )\ )           (                     
(()/( (   )  (  )\            (  (    
 /(_)))\ /(( )\((_)(  `  )   ))\ )(   
(_))_((_|_))((_)_  )\ /(/(  /((_|()\  
 |   \(_))((_|_) |((_|(_)_\(_))  ((_) 
 | |) | \ V /| | / _ \ '_ \) -_)| '_| 
 |___/|_|\_/ |_|_\___/ .__/\___||_|   
                     |_|              
    """,
    r"""
 _ .-') _                 (`-.                                     _ (`-.    ('-.  _  .-')   
( (  OO) )              _(OO  )_                                  ( (OO  ) _(  OO)( \( -O )  
 \     .'_   ,-.-') ,--(_/   ,. \ ,-.-')  ,--.      .-'),-----.  _.`     \(,------.,------.  
 ,`'--..._)  |  |OO)\   \   /(__/ |  |OO) |  |.-') ( OO'  .-.  '(__...--'' |  .---'|   /`. ' 
 |  |  \  '  |  |  \ \   \ /   /  |  |  \ |  | OO )/   |  | |  | |  /  | | |  |    |  /  | | 
 |  |   ' |  |  |(_/  \   '   /,  |  |(_/ |  |`-' |\_) |  |\|  | |  |_.' |(|  '--. |  |_.' | 
 |  |   / : ,|  |_.'   \     /__),|  |_.'(|  '---.'  \ |  | |  | |  .___.' |  .--' |  .  '.' 
 |  '--'  /(_|  |       \   /   (_|  |    |      |    `'  '-'  ' |  |      |  `---.|  |\  \  
 `-------'   `--'        `-'      `--'    `------'      `-----'  `--'      `------'`--' '--' 
    """,
    r"""
 _(`-')     _           (`-')  _                         _  (`-') (`-')  _   (`-')  
( (OO ).-> (_)         _(OO ) (_)      <-.        .->    \-.(OO ) ( OO).-/<-.(OO )  
 \    .'_  ,-(`-'),--.(_/,-.\ ,-(`-'),--. )  (`-')----.  _.'    \(,------.,------,) 
 '`'-..__) | ( OO)\   \ / (_/ | ( OO)|  (`-')( OO).-.  '(_...--'' |  .---'|   /`. ' 
 |  |  ' | |  |  ) \   /   /  |  |  )|  |OO )( _) | |  ||  |_.' |(|  '--. |  |_.' | 
 |  |  / :(|  |_/ _ \     /_)(|  |_/(|  '__ | \|  |)|  ||  .___.' |  .--' |  .   .' 
 |  '-'  / |  |'->\-'\   /    |  |'->|     |'  '  '-'  '|  |      |  `---.|  |\  \  
 `------'  `--'       `-'     `--'   `-----'    `-----' `--'      `------'`--' '--' 
    """,
    r"""
 _______   __  ____    ____  __   __        ______   .______    _______ .______      
|       \ |  | \   \  /   / |  | |  |      /  __  \  |   _  \  |   ____||   _  \     
|  .--.  ||  |  \   \/   /  |  | |  |     |  |  |  | |  |_)  | |  |__   |  |_)  |    
|  |  |  ||  |   \      /   |  | |  |     |  |  |  | |   ___/  |   __|  |      /     
|  '--'  ||  |    \    /    |  | |  `----.|  `--'  | |  |      |  |____ |  |\  \----.
|_______/ |__|     \__/     |__| |_______| \______/  | _|      |_______|| _| `._____|
                                                                                     
    """,
    r'''
   ___      _               _       _              _ __                  
  |   \    (_)    __ __    (_)     | |     ___    | '_ \   ___      _ _  
  | |) |   | |    \ V /    | |     | |    / _ \   | .__/  / -_)    | '_| 
  |___/   _|_|_   _\_/_   _|_|_   _|_|_   \___/   |_|__   \___|   _|_|_  
_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""| 
"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-' 
    ''',

]

codes = [
    ("8006", "E/S Fora lloc habitual"),
    ("8010", "E/S Teletreball"),
    ("8002", "Manca de fluid elèctric"),
    ("8004", "Oblit"),
    ("8007", "Pèrdua targeta"),
    ("8001", "Rellotge espatllat"),
    ("8005", "Targeta espatllada"),
    ("8008", "Targeta pendent d'alta"),
]

day_names = [
    "Dilluns",
    "Dimarts",
    "Dimecres",
    "Dijous",
    "Divendres",
    "Dissabte",
    "Diumenge",
]


@lru_cache
def get_weekday(date: str) -> str:
    parsed = datetime.strptime(date, "%d/%m/%Y")
    return day_names[parsed.weekday()]


def get_cookies() -> Tuple[str, str]:
    print("Primer de tot, necessitem les cookies de la teva sessió del Tempus per poder fitxar.")
    if browser_cookie3 is None:
        return get_cookies_manually()
    print("Les intentarem obtenir automàticament, però si no funciona, les hauràs d'introduir manualment.")
    print("Per obtenir-les, necessitem que iniciïs sessió al Tempus des d'un navegador: https://tempus.upc.edu/")
    print("Un cop iniciada la sessió, torna aquí i prem ENTER.")
    input()

    try:
        cj = browser_cookie3.load(domain_name='tempus.upc.edu')
        cookie_base = cj._cookies['tempus.upc.edu']['/']['JSESSIONID'].value
        cookie_rlg = cj._cookies['tempus.upc.edu']['/RLG']['JSESSIONID'].value

        return cookie_base, cookie_rlg
    except (KeyError, PermissionError) as e:
        print("No s'ha pogut obtenir les cookies automàticament a causa del següent error:")
        print(f"\t{e}")
        print("Necessitem que les introdueixis manualment.")
        return get_cookies_manually()


def get_cookies_manually() -> Tuple[str, str]:
    print("Per obtenir-les, segueix les següents instruccions:")
    print("\t1. Entra a https://tempus.upc.edu i inicia sessió")
    print("\t2. Obre la consola del navegador (F12) i ves a l'apartat 'Aplicació' (Chrome o Edge) o "
          "'Emmagatzematge' (Firefox)")
    print("\t3. A l'apartat 'Cookies', subapartat 'https://tempus.upc.edu', haurien d'apareixer dues cookies, "
          "ambdues amb nom 'JSESSIONID', amb diferents valors a 'Valor' i a 'Ruta'")
    print("\t4. Copia el valor de les dues cookies i enganxa-les a continuació:")

    cookie_base = input("JSESSIONID amb Ruta '/': ")
    cookie_rlg = input("JSESSIONID amb Ruta '/RLG': ")

    return cookie_base, cookie_rlg


def get_code() -> str:
    print("Primer, indica quin tipus de fitxatge vols fer. Tens les opcions següents:")
    for i, (code, desc) in enumerate(codes):
        print(f"\t{i + 1}. {desc}")
    code = input("Introdueix el número de l'opció [4]: ")
    if not code.isnumeric():
        print("Opció no vàlida, els fitxatges es faran com 'Oblit'.")
        code = "4"
    code = int(code)
    if code < 1 or code > len(codes):
        print("Opció no vàlida, els fitxatges es faran com 'Oblit'.")
        code = 4
    print(f"Has triat l'opció {code}: {codes[code - 1][1]}")
    return codes[code - 1][0]


def get_dates_in_range(date_range: str) -> list[str]:
    try:
        start, end = date_range.split("-")
        start = datetime.strptime(start, "%d/%m/%Y")
        end = datetime.strptime(end, "%d/%m/%Y")
        days = (end - start).days + 1
        return [(start + timedelta(days=i)).strftime("%d/%m/%Y") for i in range(days)]
    except:
        print(f"El format del rang {date_range} no és vàlid. S'ignorarà.")
        return []


def is_weekend(date: str) -> bool:
    parsed = datetime.strptime(date, "%d/%m/%Y")
    return parsed.weekday() >= 5


def is_valid_date(date: str) -> bool:
    try:
        datetime.strptime(date, "%d/%m/%Y")
        return True
    except ValueError:
        return False


def is_valid_hour(hour: str) -> bool:
    try:
        datetime.strptime(hour, "%H:%M")
        return True
    except ValueError:
        return False


def get_dates(with_intro: bool = True) -> list[str]:
    if with_intro:
        print('Ara, indica les dates en les que vols fer els fitxatges.')
        print("\tLes dates han d'estar en format 'dd/mm/aaaa' i separades per comes.")
        print("\tTambé pots introduir rangs de dates en format 'dd/mm/aaaa-dd/mm/aaaa'.")
        print("\tEn els rangs, els caps de setmana s'ignoraran, però compte amb els festius!")
        print("\tPer exemple, '03/07/2023-05/07/2023, 10/07/2023' farà fitxatges els dies "
              "3, 4, 5 i 10 de juliol del 2023.")
    dates = input('Introdueix les dates: ')
    dates = dates.replace(' ', '').split(',')
    final_dates = []
    for date in dates:
        if '-' in date:
            range_dates = get_dates_in_range(date)
            for range_date in range_dates:
                if not is_weekend(range_date):
                    final_dates.append(range_date)
        else:
            if is_valid_date(date):
                final_dates.append(date)
            else:
                print(f"La data '{date}' no és vàlida, s'ignorarà.")

    print('Els fitxatges es faran els dies:')
    for date in final_dates:
        print(f'  - {date} ({day_names[datetime.strptime(date, "%d/%m/%Y").weekday()]})')
    correct = input('És correcte? [S/n]').lower() in ['s', '']
    if not correct:
        return get_dates(with_intro=False)
    return final_dates


def get_hours(with_intro: bool = True) -> list[str]:
    if with_intro:
        print('Ara, indica les hores en les que vols fer els fitxatges.')
        print("\tLes hores han d'estar en format 'hh:mm' i separades per comes.")
        print("\tPer exemple, '08:00, 13:00, 17:00' farà fitxatges a les 8 del matí, a la 1 del migdia i a les 5 de la "
              "tarda.")
    hours = input('Introdueix les hores: ')
    hours = hours.replace(' ', '').split(',')
    final_hours = []
    for hour in hours:
        if is_valid_hour(hour):
            final_hours.append(hour)
        else:
            print(f"La hora '{hour}' no és vàlida, s'ignorarà.")

    print('Els fitxatges es faran a les hores:')
    for hour in final_hours:
        print(f'\t- {hour}')
    correct = input('És correcte? [S/n]').lower() in ['s', '']
    if not correct:
        return get_hours(with_intro=False)
    return final_hours


def clock_in_request(cookie_base, cookie_rlg, code, date, hour) -> bool:
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,ca;q=0.7,it;q=0.6',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Content-Length': '457',
        'Cookie': f'JSESSIONID={cookie_base}; JSESSIONID={cookie_rlg}',
        'Dnt': '1',
        'Host': 'tempus.upc.edu',
        'Origin': 'https://tempus.upc.edu',
        'Referer': 'https://tempus.upc.edu/RLG/solicitudMarcatges/list',
        'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67',
    }
    content = {
        'codiSolicitudMarcatge': (None, code),
        'data': (None, date),
        'hora': (None, hour),
        '_action_save': (None, "Crear"),
    }
    response = requests.post('https://tempus.upc.edu/RLG/solicitudMarcatges/list',
                             headers=headers,
                             files=content,
                             )
    if response.status_code >= 400:
        return False
    return True


def clock_in(cookie_base, cookie_rlg, code, dates, hours, wait=2) -> None:
    print(
        f'Procedim a fer els fitxatges. Es deixarà un marge de {wait} {'segons' if wait != 1 else 'segon'} entre cada fitxatge.')
    for date in dates:
        print(f'\t {get_weekday(date)} {date}: ', end='')
        for hour in hours:
            print(f'{hour} ', end='', flush=True)
            if clock_in_request(cookie_base, cookie_rlg, code, date, hour):
                print(f'✓   ', end='', flush=True)
            else:
                print(f'✗   ', end='', flush=True)
            time.sleep(wait)
        print()


def clock(cookie_base, cookie_rlg):
    clocking = True
    while clocking:
        code = get_code()
        dates = get_dates()
        hours = get_hours()
        clock_in(cookie_base, cookie_rlg, code, dates, hours)
        clocking = input('Vols fer més fitxatges? [s/N]').lower() == 's'


def main():
    print("Benvigut al Fitxador automàtic del Tempus UPC, proveït per")
    print(arts[random.Random().randint(0, len(arts) - 1)])

    cookie_base, cookie_rlg = get_cookies()

    print("Perfecte, ara procedirem a fer els fitxatges.")
    clock(cookie_base, cookie_rlg)


if __name__ == '__main__':
    main()

# Fitxador automàtic pel Tempus UPC

Aquesta eina permet sol·licitar múltiples marcatges pendents al Tempus fàcilment.

## Requisits

Per executar aquest script, cal tenir instal·lat Python 3.7 o superior.  
De la resta de dependències se'n fa càrrec el programa, tot i que si vols instal·lar-les manualment, pots fer-ho amb
la següent comanda:

```bash
pip install requests browser_cookie3
```

La llibreria `browser_cookie3` és opcional i s'utilitza per obtenir automàticament les cookies necessàries de l'usuari 
del navegador, però si no es troben o la llibreria no està instal·lada, les hauràs d'introduir manualment seguint.

## Ús

Per executar-lo, només cal executar el següent:

```bash
python tempus.py
```

El programa t'anirà donant instruccions per a cada pas.

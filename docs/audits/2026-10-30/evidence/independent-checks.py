import json,math,datetime
from decimal import Decimal
from pathlib import Path
root=Path(__file__).parent
registry=json.loads((root/'registry-results.json').read_text());tools={t['slug']:t for t in registry['tools']}; checks=[]
def check(slug,key,expected,tol=0.005):
 r=tools[slug].get('result',{});actual=r
 for k in key.split('.'): actual=actual[int(k)] if isinstance(actual,list) else actual[k]
 ok=abs(float(actual)-float(expected))<=tol
 checks.append(dict(tool=slug,path=key,expected=str(expected),actual=str(actual),tolerance=tol,passed=ok))
check('cagr-calculator','percentage',((161051/100000)**(1/5)-1)*100)
check('roi-calculator','profit',125000-100000);check('roi-calculator','percentage',25)
for s,e in [('margin-calculator',30),('markup-calculator',300/700*100),('break-even-calculator',250),('pricing-calculator',1180),('cash-flow-calculator',270000),('burn-rate-calculator',100000),('runway-calculator',4.5),('marketplace-margin-calculator',32),('roas-calculator',4),('emi-calculator',1000000*(.1/12)*(1+.1/12)**60/((1+.1/12)**60-1)),('sip-calculator',10000*((1.01)**120-1)/.01),('fd-calculator',100000*(1+.07/4)**4),('xirr-calculator',((1.1)**(365/366)-1)*100),('ltv-calculator',2000*.7/.05),('equity-dilution-calculator',6000000/30000000*100)]:check(s,'headline.value',e)
for s,k,e in [('percentage-calculator','result',200),('discount-calculator','finalPrice',900),('area-converter','convertedValue',1/.3048**2),('business-days-calculator','businessDays',5),('fuel-expense-calculator','fuelCost',100/15*100),('volumetric-weight-calculator','dimensionalWeightKg',30*20*15/5000),('volumetric-weight-calculator','chargeableWeightKg',2),('depreciation-calculator','annualDepreciation',(100000-5000)/5),('professional-tax-calculator','monthlyTax',200),('leave-balance-calculator','remainingLeave',24/12*8-4),('currency-converter','convertedAmount',12),('pricing-assistant','metrics.0.value',600/(1-.4)/(1-.1)),('startup-cost-estimator','metrics.4.value',(65000+70000*6)*1.1)]:check(s,k,e)
(root/'independent-checks.json').write_text(json.dumps(checks,indent=2))
print(f'{len(checks)} independent numeric comparisons; {sum(c["passed"] for c in checks)} passed')

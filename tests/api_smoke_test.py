import json, urllib.request, urllib.error
B='http://localhost:5000/api'
ok=fail=0
def call(method, path, body=None, token=None, raw=False):
    req=urllib.request.Request(B+path, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header('Content-Type','application/json')
    if token: req.add_header('Authorization','Bearer '+token)
    try:
        r=urllib.request.urlopen(req); return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        t=e.read()
        try: return e.code, json.loads(t)
        except: return e.code, {'message':t[:120].decode(errors='ignore')}
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok+=1; print('PASS', name)
    else: fail+=1; print('FAIL', name, extra)

s,d=call('GET','/products?limit=50'); prods={p['name']:p for p in d['products']}
check('list products', s==200 and d['total']==16, d.get('total'))
s,d=call('GET','/products?keyword=boot'); check('search "boot" (partial match)', s==200 and [p['name'] for p in d['products']]==['Switchback Hiking Boots'], d)
s,d=call('GET','/products?keyword=%28%28'); check('search with regex chars is safe', s==200 and d['total']==0, d)
s,d=call('GET','/products?category=Footwear&inStock=true&sort=price-desc'); check('filter category+inStock+sort', s==200 and [p['price'] for p in d['products']]==[169,64], d)
s,d=call('GET','/products?featured=true'); check('featured filter', s==200 and d['total']==5, d.get('total'))
s,d=call('GET','/products?page=2&limit=12'); check('pagination page 2', s==200 and len(d['products'])==4 and d['pages']==2)
s,d=call('GET','/products/'+prods['Daybreak 22L Daypack']['_id']); check('product detail + related', s==200 and len(d['related'])>0)
s,d=call('GET','/products/notanid'); check('bad product id -> 404', s==404, (s,d))

s,d=call('POST','/auth/register',{'name':'Test User','email':'t@t.com','password':'secret1'}); tok=d.get('token'); check('register', s==201 and tok)
s,d=call('POST','/auth/register',{'name':'x','email':'t@t.com','password':'secret1'}); check('duplicate email -> clean 400', s==400 and 'already in use' in d['message'], (s,d))
s,d=call('POST','/auth/register',{'name':'x','email':'bad','password':'secret1'}); check('invalid email rejected', s==400, (s,d))
s,d=call('POST','/auth/login',{'email':'t@t.com','password':'wrong'}); check('wrong password -> 401', s==401)
s,d=call('POST','/auth/login',{'email':'shopper@tidewater.test','password':'Shopper123!'}); shop=d.get('token'); check('login shopper', s==200 and shop)
s,d=call('POST','/auth/login',{'email':'admin@tidewater.test','password':'Admin123!'}); adm=d.get('token'); check('login admin', s==200 and d['isAdmin'] and adm)
s,d=call('GET','/auth/me',token=shop); check('GET /auth/me', s==200 and d['email']=='shopper@tidewater.test')
s,d=call('PUT','/auth/profile',{'name':'Demo S.'},token=shop); check('update profile', s==200 and d['name']=='Demo S.')
s,d=call('PUT','/auth/profile',{'password':'newpass1','currentPassword':'bad'},token=shop); check('password change needs current pw', s==400)

pack=prods['Ridgeline 40L Pack']; lantern=prods['Lantern Light 600']; poles=prods['Trekking Poles (pair)']
s,d=call('POST','/orders/quote',{'items':[{'product':pack['_id'],'qty':1}]}); check('quote 1x $149 -> total 149+0 ship+11.92 tax', s==200 and d['shippingPrice']==0 and d['taxPrice']==11.92 and d['totalPrice']==160.92, d)
s,d=call('POST','/orders/quote',{'items':[{'product':pack['_id'],'qty':1}],'couponCode':'welcome10'}); check('coupon WELCOME10 (10%)', s==200 and d['discount']==14.9 and d['totalPrice']==144.83, d)
s,d=call('POST','/orders/quote',{'items':[{'product':prods['Wool Trail Socks (3-pack)']['_id'],'qty':1}],'couponCode':'TAKE20'}); check('min-order coupon rejected', s==200 and d['couponError'] and d['discount']==0, d)
s,d=call('POST','/orders/quote',{'items':[{'product':prods['Wool Trail Socks (3-pack)']['_id'],'qty':1}]}); check('shipping $8 under $100', d['shippingPrice']==8, d)
s,d=call('POST','/orders/quote',{'items':[{'product':poles['_id'],'qty':1}]}); check('out-of-stock rejected', s==400 and 'out of stock' in d['message'], d)
s,d=call('POST','/orders/quote',{'items':[{'product':lantern['_id'],'qty':5}]}); check('over-stock qty rejected', s==400 and 'Only 3' in d['message'], d)
s,d=call('POST','/orders/quote',{'items':[]}); check('empty cart rejected', s==400)

addr={'fullName':'Demo S','phone':'1','address':'1 Main St','city':'Erbil','postalCode':'44001','country':'Iraq'}
s,d=call('POST','/orders',{'items':[{'product':pack['_id'],'qty':2,'price':1}],'shippingAddress':addr,'paymentMethod':'COD','couponCode':'WELCOME10'},token=shop); order=d
check('create order ignores client price, applies coupon', s==201 and d['itemsPrice']==298 and d['discount']==29.8 and d['totalPrice']==289.66, d)
s,d=call('GET','/products/'+pack['_id']); check('stock decremented 24 -> 22', d['product']['countInStock']==22, d['product']['countInStock'])
s,d=call('POST','/orders',{'items':[{'product':pack['_id'],'qty':1}],'shippingAddress':addr,'paymentMethod':'Stripe'},token=shop); check('Stripe order rejected when no key', s==400, (s,d))
s,d=call('POST','/orders',{'items':[{'product':pack['_id'],'qty':1}],'shippingAddress':{'fullName':'x'},'paymentMethod':'COD'},token=shop); check('missing address fields rejected', s==400, (s,d))
s,d=call('GET','/products/'+pack['_id']); check('failed order did not leak stock', d['product']['countInStock']==22, d['product']['countInStock'])
s,d=call('GET','/orders/mine',token=shop); check('my orders', s==200 and len(d)==1)
s,d=call('GET','/orders/'+order['_id'],token=shop); check('view own order', s==200)
s,d=call('GET','/orders/'+order['_id'],token=tok); check("can't view someone else's order", s==403)
s,d=call('GET','/payment/config'); check('payment config (stripe off)', d=={'stripeEnabled':False}, d)
s,d=call('PUT','/orders/'+order['_id']+'/cancel',token=shop); check('cancel order', s==200 and d['status']=='Cancelled')
s,d=call('GET','/products/'+pack['_id']); check('cancel restocks 22 -> 24', d['product']['countInStock']==24, d['product']['countInStock'])
s,d=call('PUT','/orders/'+order['_id']+'/cancel',token=shop); check('double cancel rejected', s==400)

s,d=call('POST','/products/'+pack['_id']+'/reviews',{'rating':5,'comment':'Great pack'},token=shop); check('add review', s==201)
s,d=call('POST','/products/'+pack['_id']+'/reviews',{'rating':4,'comment':'again'},token=shop); check('duplicate review rejected', s==400)
s,d=call('GET','/products/'+pack['_id']); check('rating recalculated', d['product']['rating']==5 and d['product']['numReviews']==1)
s,d=call('POST','/wishlist/'+pack['_id'],token=shop); check('wishlist add', s==200 and d['added'])
s,d=call('GET','/wishlist',token=shop); check('wishlist list', len(d)==1 and d[0]['name']=='Ridgeline 40L Pack')
s,d=call('POST','/wishlist/'+pack['_id'],token=shop); check('wishlist remove', s==200 and not d['added'])

s,d=call('GET','/admin/stats',token=shop); check('admin route blocks shopper (403)', s==403)
s,d=call('GET','/admin/stats'); check('admin route blocks anonymous (401)', s==401)
s,d=call('POST','/products',{'name':'x'},token=shop); check('shopper cannot create product', s==403)
# new order for admin tests
s,d=call('POST','/orders',{'items':[{'product':pack['_id'],'qty':1}],'shippingAddress':addr,'paymentMethod':'COD'},token=shop); o2=d
s,d=call('GET','/admin/stats',token=adm); check('admin stats', s==200 and d['orders']==2 and len(d['last7'])==7 and d['byStatus'].get('Processing')==1, d if s!=200 else d['byStatus'])
s,d=call('GET','/admin/orders?status=Processing',token=adm); check('admin orders list+filter', s==200 and d['total']==1)
s,d=call('PUT','/admin/orders/'+o2['_id'],{'status':'Delivered'},token=adm); check('mark delivered -> COD auto-paid', s==200 and d['isPaid'] and d['deliveredAt'], d)
s,d=call('POST','/products',{'name':'Test Tent','description':'d','category':'Camp & Cook','price':99.5,'countInStock':7,'images':['https://x/y.jpg']},token=adm); newp=d; check('admin create product', s==201)
s,d=call('POST','/products',{'name':'bad'},token=adm); check('product validation errors -> 400', s==400, d)
s,d=call('PUT','/products/'+newp['_id'],{'price':89,'featured':True},token=adm); check('admin update product', s==200 and d['price']==89 and d['featured'])
s,d=call('DELETE','/products/'+newp['_id'],token=adm); check('admin delete product', s==200)
s,d=call('POST','/admin/coupons',{'code':'sale5','type':'fixed','value':5},token=adm); cid=d.get('_id'); check('create coupon (uppercased)', s==201 and d['code']=='SALE5')
s,d=call('PUT','/admin/coupons/'+cid,{'active':False},token=adm)
s,d=call('POST','/orders/quote',{'items':[{'product':pack['_id'],'qty':1}],'couponCode':'SALE5'}); check('disabled coupon rejected', d['couponError'], d)
s,d=call('DELETE','/admin/coupons/'+cid,token=adm); check('delete coupon', s==200)
s,d=call('GET','/admin/users',token=adm); uid=[u for u in d if u['email']=='t@t.com'][0]['_id']; check('admin list users (no password leak)', s==200 and all('password' not in u for u in d))
s,d=call('PUT','/admin/users/'+uid,{'isAdmin':True},token=adm); check('promote user', s==200 and d['isAdmin'])
s,d=call('DELETE','/admin/users/'+uid,token=adm); check('delete user', s==200)
s,d=call('GET','/nope'); check('unknown API route -> 404 JSON', s==404 and 'message' in d)
print(f'\nRESULT: {ok} passed, {fail} failed')

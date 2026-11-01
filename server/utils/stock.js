import Product from '../models/Product.js';
import HttpError from './httpError.js';

// Reserve stock atomically (one guarded update per line). If any line fails,
// everything already reserved is given back and the error is re-thrown.
// Items look like { product, variant?, qty, name }.
export const reserve = async (items, message = (i) => `${i.name} just sold out. Update your cart`) => {
  const done = [];
  try {
    for (const i of items) {
      const r = i.variant
        ? await Product.updateOne(
            { _id: i.product, variants: { $elemMatch: { _id: i.variant, countInStock: { $gte: i.qty } } } },
            { $inc: { 'variants.$.countInStock': -i.qty, countInStock: -i.qty, sold: i.qty } }
          )
        : await Product.updateOne({ _id: i.product, countInStock: { $gte: i.qty } }, { $inc: { countInStock: -i.qty, sold: i.qty } });
      if (r.modifiedCount !== 1) throw new HttpError(400, message(i));
      done.push(i);
    }
  } catch (err) {
    await release(done);
    throw err;
  }
};

// Put stock back (cancelled order, failed save).
export const release = (items) =>
  Promise.all(
    items.map((i) =>
      i.variant
        ? Product.updateOne({ _id: i.product, 'variants._id': i.variant }, { $inc: { 'variants.$.countInStock': i.qty, countInStock: i.qty, sold: -i.qty } })
        : Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.qty, sold: -i.qty } })
    )
  );

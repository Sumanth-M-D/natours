export default class APIFeatures {
   constructor(query, queryObject) {
      this.query = query;
      this.queryObject = queryObject;
   }

   filter() {
      /* 1.1. FILTERING 
            (for removing advanced operations from initial query)
            URL ==> /tours?difficulty=easy
            MONGOOSE QUERY ==> query.find({difficulty:'easy'})        */
      const queryObj = { ...this.queryObject };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach((ele) => delete queryObj[ele]);

      //.
      /* 1.2. ADVANCED FILTERING 
                  URL ==> /tours?price[lt]=1000
                  MONGOOSE QUERY => query.find({duration:{$gte:5}})         */
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replaceAll(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

      this.query = this.query.find(JSON.parse(queryStr));

      return this;
   }

   sort() {
      /* 2. SORTING 
            URL ==> /tours?sort=price,ratingsAverage
            MONGOOSE QUERY  ==>  query.sort('price ratingsAverage');                  */
      if (this.queryObject.sort) {
         const sortBy = this.queryObject.sort.split(',').join(' ');
         this.query = this.query.sort(sortBy);
      } else {
         this.query = this.query.sort('-createdAt');
      }
      return this;
   }

   limitFields() {
      /* 3. FIELD LIMITING
            URL ==> /tours?fields=name,duration,difficulty,price
            MONGOOSE QUERY ==>   query.select('name duration difficulty price')           */
      if (this.queryObject.fields) {
         const fields = this.queryObject.fields.split(',').join(' ');
         this.query = this.query.select(fields);
      } else {
         this.query.select('-__v'); //* Excluding the "__v" filed
      }

      return this;
   }

   paginate() {
      /* 4. PAGINATION
            URL ==>  /tours?page=2&limit=10  (page1 = 1-10, page2 = 11-20)
            MONGOOSE QUERY ==> query.skip(1*10).limit(10)                */
      const page = this.queryObject.page * 1 || 1;
      const limit = this.queryObject.limit * 1 || 100;
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);

      return this;
   }
}

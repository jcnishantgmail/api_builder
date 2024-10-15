var Mongoose = require('mongoose'),
  Schema = Mongoose.Schema;
module.exports = (mongoose) => {
    var schema = mongoose.Schema(
      {
        title: String,
        slug:String,
        description: String,
        meta_title:String,
        meta_description:String,
        meta_keyword:Array,       
        status: { type: String, default: 'active' },
        isDeleted: { type: Boolean, default: false },
        createdAt: Date,
        updatedAt: Date,
        image: String
      },
      { timestamps: true }
    );
  
    schema.method('toJSON', function () {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const cms = mongoose.model('cms', schema);
    return cms;
  };
  
var BookInstance = require('../models/bookinstance');
const Book = require('../models/book')
const { body, validationResult } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter');
const async = require('async');
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
      
  };

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
        if (err) { return next(err) }
        if (bookinstance == null) {
            let err = new Error('Book copy not found');
            err.status = 404;
            return next(err)
        }
        res.render('bookinstance_detail', ({ title: 'copy: ' + bookinstance.book.title, bookinstance: bookinstance }));
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    Book.find({}, 'title').exec(function (err, books) {
        if (err) { return next(err); }
        res.render('bookinstance_form',{title:'Create BookInstance',book_list:books})
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', "Book must be specified").trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    //sanitize

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    //process req
    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        );
        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec(function (err, books) {
                if (err) { return next(err); }
                res.render('bookinstance_form', { title: "Creat Bookinstance", book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                res.redirect(bookinstance.url);
                
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
    BookInstance.findById(req.params.id,function(err,results){
        if (err) { res.send("Error!") }
        else if(results === null) {res.send('book not found')}
        else {
            console.log(results);
        
            res.render("bookinstance_delete", { title: "Delete Book", bookTitle: results.book.title, id: results._id, imprint: results.imprint })
        }
    }).populate('book')
}



// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = [
    body('bookinstance_id', "No book instance given").trim().isLength({ min: 1 }),
    (req, res, next) => {
        let errors = validationResult("bookinstance_id");
        if (errors.isEmpty()) {
            
            BookInstance.findByIdAndDelete(req.body.bookinstance_id, () => {
                console.log('deleting from db')
                
                res.redirect('/catalog/bookinstances')
            });
        } else { console.log("error deleting from DB"); res.redirect("/catalog") }
    }
           

    ];
// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
    async.parallel({
        books: function (callback) { Book.find().exec(callback) },
        bookinstance: function (callback) { BookInstance.findById(req.params.id, callback) }
    },
        (err, results) => {
            if (err) { return next(err) }
            else {
                console.log(results)
                res.render("bookinstance_form",{title:"Update Instance", book_list:results.books,bookinstance:results.bookinstance})
            }
        });
}
    


//helper function for alpha space?

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', "Book must be specified").trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    //sanitize

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        let errors = validationResult(req);
        if (!(errors.isEmpty())) {
            async.parallel({
                books: function (callback) { Book.find().exec(callback) },
                bookinstance: function (callback) { BookInstance.findById(req.params.id, callback) }
            },
                (err, results) => {
                    if (err) { return next(err) }
                    else {
                        console.log(results)
                        res.render("bookinstance_form",{title:"Update Instance",errors:errors.array(), book_list:results.books,bookinstance:results.bookinstance})
                    }
                });
           
        } else {
            async.parallel({
                book: function (callback) {
                    Book.find({ "title": req.body.book }).exec(callback)
                },
                bookinstance: function(callback){ BookInstance.findById(req.params.id).exec(callback)}
             
            }, function (err, results) {
                    if (err) { return next(err) }
                    if (results === null) {
                        let notFound = new Error("Book or Book-Instance not found")
                        notFound.status = 404;
                        return next(notFound);
                    }
                    let updatedBook = {
                        book: req.body.book,
                        imprint: req.body.imprint,
                        status: req.body.status,
                        due_back: req.body.due_back
                    }
                    BookInstance.findByIdAndUpdate(req.params.id, updatedBook,
                        function (err, results) {
                            console.log("DUE BACK NUM: " +req.body.due_back)
                            if (err) { return next(err) }
                            res.redirect('/catalog/bookinstances')
                    })
            })
        }
    }

];
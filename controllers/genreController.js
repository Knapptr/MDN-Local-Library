var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {

  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('genre_list', { title: 'Genre List', genre_list:  list_genres});
    });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {

            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id })
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
          { name: req.body.name }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, found_genre) {
                     if (err) { return next(err); }

                     if (found_genre) {
                         // Genre exists, redirect to its detail page.
                         res.redirect(found_genre.url);
                     }
                     else {

                         genre.save(function (err) {
                           if (err) { return next(err); }
                           // Genre saved. Redirect to genre detail page.
                           res.redirect(genre.url);
                         });

                     }

                 });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
    async.parallel({
        genre: function (callback) { Genre.findById(req.params.id).exec(callback) },
        books: function (callback) { Book.find({ "genre": req.params.id }).exec(callback) },
    },
        function (err, results) {
            if (err) { return next(err) }
            if (results.genre === null) {
                let noRes = new Error('Genre not found')
                noRes.status = 404;
                return next(noRes)
            }
            if (results.books.length > 0) {
                res.render('genre_delete',{title:"Delete Genre: error",books:results.books,genre:results.genre})
            }
            else {
                res.render('genre_delete',{title:"Delete Genre",genre:results.genre})
            }

        }
        
    )
}

// Handle Genre delete on POST.
exports.genre_delete_post = [
    body('delete').trim().isLength({ min: 1 }),
    //SAN
    sanitizeBody('delete').trim().escape(),
    //process
    (req, res, next) => {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            Genre.findByIdAndDelete(req.body.delete, function (err, results) {
                if (err) { return (next(err)) }
                else{ res.redirect('/catalog/genres')}
            })
        } else {
            let oopsie = new Error('Something went wrong')
            oopsie.status = 404;
            next(oopsie);
        }
    }
]
// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
    Genre.findById(req.params.id, function (err, results) {
        if (err) { return next(err) }
        if (results === null) {
            let notFound = new Error("Genre not found")
            notFound.status = 404;
            next(notFound);
        }
        console.log(results)
        res.render("genre_form",{title:"Update Genre", genre: results})
    })
    

};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', "Genre must have a name").trim().isLength({ min: 1 }),
    (req, res, next) => {
        let concatGenre = req.body.name.split(" ").join("")
        req.body.concatGenre = concatGenre; //to allow for spaces in genre names- but not non-letters
        next()
    },
    body('concatGenre',"Genre must be letters only").isAlpha(),
    //SAN
    sanitizeBody("name").trim().escape(),
    (req, res, next) => {
        var errors = validationResult(req);
        if (errors.isEmpty()) {
            Genre.findByIdAndUpdate(req.params.id, { "name": req.body.name }, function (err, results) {
                if (err) { return next(err) }
                res.redirect('/catalog/genres')
            })
        } else {
            Genre.findById(req.params.id, function (err, results) {
                if (err) { return next(err) }
                else {
                    console.log(errors)
                    res.render('genre_form', { title: "Update Genre", genre:results, errors:errors.array() })
                }
            })
            
        }
    }
];

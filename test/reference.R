## To run:
##
## install.packages("drat")
## drat::add("mrc-ide")
## install.packages("dde")

## Generate reference data sets for the lorenz attractor
lorenz <- function(t, y, .) {
  sigma <- 10.0
  R     <- 28.0
  b     <-  8.0 / 3.0
  y1 <- y[[1L]]
  y2 <- y[[2L]]
  y3 <- y[[3L]]
  c(sigma * (y2 - y1),
    R * y1 - y2 - y1 * y3,
    -b * y3 + y1 * y2)
}


json_array <- function(x) {
  sprintf("[%s]", paste(x, collapse = ","))
}


json_matrix <- function(d) {
  json_array(apply(matrix(sprintf("%2.18g", d), nrow(d)), 1, json_array))
}

tt <- seq(0, 25, length.out = 101)
y0 <- c(10, 1, 1)
y <- dde::dopri(y0, tt, lorenz, NULL, n_history = 1000L)
writeLines(json_matrix(y[, -1]), "ref/lorenz_r.json")

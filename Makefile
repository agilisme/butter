
BUTTER := butter
SRC_DIR := .
DIST_DIR := $(SRC_DIR)/dist
BUTTER_DIST := $(DIST_DIR)/$(BUTTER).js
BUTTER_CSS_DIST := $(DIST_DIR)/$(BUTTER).css
SOURCE_DIR := $(SRC_DIR)/src
MODULES_DIR := $(SOURCE_DIR)/modules

JS_LIBS := \
  $(MODULES_DIR)/timeline/jquery.js \
  $(MODULES_DIR)/timeline/jquery-ui.min.js \
  $(MODULES_DIR)/timeline/trackLiner.js

JS_SRCS := \
  $(SOURCE_DIR)/butter.js \
  $(MODULES_DIR)/timeline/timeline.js \
  $(MODULES_DIR)/eventEditor/butter.eventeditor.js \
  $(MODULES_DIR)/previewer/butter.previewer.js \
  $(MODULES_DIR)/butter.testmodule.js

CSS_SRCS := \
  $(MODULES_DIR)/timeline/jquery-ui-1.8.5.custom.css \
  $(MODULES_DIR)/timeline/trackLiner.css \
  $(MODULES_DIR)/butter.test.css

all: $(DIST_DIR) $(BUTTER_DIST)
	@@echo "Finished, see $(DIST_DIR)"

$(BUTTER_DIST): $(DIST_DIR) $(JS_SRCS) $(CSS_SRCS)
	@@echo "Building $(BUTTER_DIST)"
	@@cat $(JS_LIBS) > $(BUTTER_DIST)
	@@cat $(JS_SRCS) >> $(BUTTER_DIST)
	@@echo "Building $(BUTTER_CSS_DIST)"
	@@cat $(CSS_SRCS) > $(BUTTER_CSS_DIST)

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

clean:
	@@rm -fr $(DIST_DIR)

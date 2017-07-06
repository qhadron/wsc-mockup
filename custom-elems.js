randInt = function (range, start) {
	return Math.floor(Math.random() * range) + (start || 0);
}

waitabit = function (time, ...args) {
	return new Promise(resolve => setTimeout(resolve, time, ...args));
}

loadPageAsTemplate = function (url) {
	let req = new XMLHttpRequest();
	req.open('GET', url, false);
	req.send(null);
	let temp = document.createElement('template');
	temp.innerHTML = req.responseText;
	return temp;
}

flatten = (acc, arr) => arr ? acc.concat(arr) : (acc ? acc : []);

function populateDateSelectors() {
	const newEntryText = 'New Entry';

	function generateSelector(elem) {
		let containers = (function () {
			let ret = null;
			let selector = null;
			let root = null;

			// check tags for info
			if (elem.hasAttribute('container-selector')) {
				selector = elem.getAttribute('container-selector');
			}
			if (elem.hasAttribute('parent-level')) {
				let n = Number(elem.getAttribute('parent-level'));
				root = elem;
				while (n-- > 0) {
					root = root.parentElement;
				}
			}

			// select containers
			if (selector) {
				root = root || document;
				ret = Array.from(root.querySelectorAll(selector));
			}
			else {
				root = root || elem.parentElement;
				ret = [root];
			}

			return ret;
		})();
		elem.innerHTML =
			`
			<select class="form-control">
				<option>2015-07-21</option>
				<option>2016-01-24</option>
				<option>2017-09-23</option>
				<option selected="selected">2018-08-26</option>
				<option>${newEntryText}</option>
			</select>
		`;

		elem.classList.add('pull-right');
		elem.style.transform += 'translateY(-4px)';

		let select = elem.firstElementChild;

		let getControls = function () {
			// get list of controls
			let controls =
				containers.map(c => Array.from(c.querySelectorAll('input, select, textarea, button, div.btn')))
				.reduce(flatten)
				.filter(x => x != select); // make sure we don't disable ourselves
			return controls;
		}

		// sample data regex
		const regex = /Sample input on \d+-\d+-\d+/;

		let showOldData = function (date) {
			let controls = getControls();

			// populate with default data for controls
			// note: this needs to be done before disabling to dispatch the onchange events
			controls.forEach(c => {
				const type = c.getAttribute('type') || c.type;
				// numbers
				if (c.tagName === 'INPUT' && type == 'number') {
					c.value = randInt(100);
				}
				// text
				else if (c.tagName === 'TEXTAREA' || (c.tagName === 'INPUT' && type == 'text')) {
					if (regex.test(c.value) || c.value === '' || typeof c.value === 'undefined')
						c.value = `Sample input on ${date}`;
				}
				// dropdown
				else if (c.tagName === 'SELECT') {
					// select random option
					let option = randInt(c.childElementCount);
					c.selectedIndex = option;
				}
				// date
				else if (c.tagName === 'INPUT' && type === 'date') {
					c.value = date;
				}
				// time
				else if (c.tagName === 'INPUT' && type === 'time') {
					let date = new Date(0, 0, 0, randInt(24), randInt(60), randInt(60));
					c.value = date.toISOString().slice(-13, -5);
				}
				// checkbox
				else if (c.tagName === 'INPUT' && type === 'checkbox') {
					c.checked = Math.random() >= 0.5;
				}

				c.disabled = false;
			});

			// dispatch event and enable controls
			waitabit().then(_ => {
				controls.forEach(c => {
					c.dispatchEvent(new Event('change'));
					c.disabled = true;
				});
			});
		}

		let onchange = function (e) {
			let val = select.value;
			if (val === newEntryText) {
				let controls = getControls();
				controls.forEach(e => {
					e.disabled = false;
				});
			}
			else {
				showOldData(val);
			}
		}

		elem.addEventListener('change', onchange);
		elem.addEventListener('click', e => e.preventDefault());
		onchange();
	}
	Array.from(document.querySelectorAll('date-selector'))
		.filter(elem => elem.childElementCount === 0)
		.forEach(generateSelector);
}

function populateRemarks() {
	let onchange = function () {
		let ta = document.getElementById(remarkId);
		let option = select.value;
		if (option !== "New Remark") {
			ta.value = `Sample remark on ${option}`;
			ta.disabled = true;
		}
		else {
			ta.value = "";
			ta.disabled = false;
		}
	};

	function generateRemarks(elem) {
		let remarkName = elem.getAttribute('remark');
		let remarkId = 'remark' + '-' + remarkName.replace(/ /g, '-');
		let remarkText = elem.getAttribute('remark-label');
		elem.innerHTML = `<div class="col-sm-4" style="text-align: right;">
	<label for="${remarkId}" class="control-label" style="display: block;"> ` +
			//	remarkText ? remarkText + ' ' : '' + 
			`Remark</label>
	${
//	(elem.hasAttribute('date-selector')) 
		false
		?
		`
		<select class="form-control" name="${remarkId}-date" id="${remarkId}-date" style="float: right;">
			<option>2015-07-21</option>
			<option>2016-01-24</option>
			<option>2017-09-23</option>
			<option selected="selected">2018-08-26</option>
			<option>New Remark</option>
		</select>
		` : ''
	}
</div>
<div class="col-sm-8">
	<textarea id="${remarkId}" rows="5" cols="35" name="${remarkId}" class="form-control" maxlength="500"></textarea>
</div>
`;
		if (elem.hasAttribute('date-selector')) {
			let select = elem.querySelector('select');
			if (select) {
				select.addEventListener('change', onchange);
				onchange();
			}
		}
	}

	Array.from(document.querySelectorAll('[remark]'))
		.filter(elem => elem.childElementCount === 0)
		.forEach(generateRemarks);
}

function populateEffectiveDates() {
	const attribute = 'effective-date';

	function generateEffectiveDate(elem) {
		let dateId = attribute + '-' + elem.getAttribute(attribute).replace(/ /g, '-');
		let labelText = (function () {
			if (!elem.hasAttribute('label'))
				return '';
			else {
				let label = elem.getAttribute('label');
				if (! label || label.length == 0) {
					return elem.getAttribute(attribute);
				}
			}
		})();
		let required = !elem.hasAttribute('optional');
		elem.innerHTML = `
<label for="" class="control-label col-sm-4 ${required ? 'required' : ''}">${labelText ? labelText + ' ' : ''}Effective Date</label>
<div class="col-sm-8">
	<label for="${dateId}-date" style="display: inline;"> </label>
	<input style="display:inline;" class="form-control" type="date" id="${dateId}-date" name="${dateId}-date" data-rule-dateISO="true" placeholder="YYYY-MM-DD" ${required ? 'required="required"' : ""}/>
	<label for="${dateId}-time" style="display: inline;"></label>
	<input style="display:inline;" class="form-control" type="time" id="${dateId}-time" name="${dateId}-time" placeholder="hh:mm:ss"  ${required ? 'required="required"' : ""}/>
</div>
`;
		//console.log(
			$(elem).find('input[type="date"]').trigger('wb-init.wb-date')
		//);
	}

	Array.from(document.querySelectorAll(`[${attribute}]`))
		.filter(elem => elem.childElementCount === 0)
		.forEach(generateEffectiveDate);
}

let populateHistoryTabs  = (function () {
	
	function generateTab(elem) {
		// init variables
		let template = this.history_template || (this.history_template=loadPageAsTemplate('ajax/templates/history-tab.html'));
		let slots = this.slots || (this.slots = Array.from(template.content.querySelectorAll('child-content') || []));
		this.first = typeof this.first == "undefined" ? true : false;
		
		slots.forEach(s => (s.innerHTML = elem.innerHTML));
		let clone = document.importNode(template.content, true);
		let arr = Array.from(clone.children);
		elem.parentElement.replaceChild(clone, elem);
		return arr;
	}
	
	Array.from(document.querySelectorAll('history-tab, template[history-tab]'))
	// generates tab and returns the children
	.map(generateTab)
	// flatten to single array
	.reduce(flatten, [])
	// populate custom elements
	// .map(e => populateCustomElems() || e) // not needed since the other things get populated after we finish generating
	// wait a bit and initialize tabs. Delay on first trigger must be at least 1s to account for $ initialization
	.map(e => 
		waitabit(this.first ? 1000 : 0).then(_ => $(e).trigger('wb-init.wb-tabs'))
	);
}).bind({});


let setPageHeader = (function () {
	const template = this.template || (this.template=loadPageAsTemplate('ajax/templates/update-page-header.html'));
	const title = this.title || (this.title = template.content.querySelector('h1'));
	Array.from(document.querySelectorAll('[property="name"]'))
	.forEach( e => {
		const match = /(\w+) (.*) - .*$/.exec(document.title);
		title.textContent = `${match[2]}`;
		e.parentElement.replaceChild(template.content.cloneNode(true), e);
	});
}).bind({});

populateCustomElems = function() {
	populateHistoryTabs(); // this should be done first
	populateRemarks();
	populateEffectiveDates();
//	populateDateSelectors();
};

// generate remark elements
window.addEventListener('load', function() {
	setPageHeader();
	$(document).on('wb-ready.wb', populateCustomElems);
})

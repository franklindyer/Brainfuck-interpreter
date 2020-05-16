var Machine = {

    bytemode: false,

    tape: ['B','R','A','I','N','F','U','C','K','!'],
    pointer: 9,
    bfcode: '',
    codepos: 0,
    inputs: [],
    loop_depth: 0,
    error: 0,
    abort: 0,
    ticker: 0,

    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    report: function(text, error=0, overwrite=0) {
        var ow = overwrite;
        if (error == 1) { ow = 1; }
        msgbox = document.getElementById("output");
        if (!this.bytemode) { 
            msgbox.innerHTML += ', ' + text;
        } else if (error == 0) {
            msgbox.innerHTML += String.fromCharCode(text);
        }
        msgbox.style.borderColor = '#47d147';
        msgbox.style.backgroundColor = '#c2f0c2';
        msgbox.style.color = '#29a329'
        if (error) {
            this.error = text;
            msgbox.style.borderColor = '#ff3300';
            msgbox.style.backgroundColor = '#ffc2b3';
            msgbox.style.color = '#ff1a1a';
        }
        if (ow) {
            if (!this.bytemode || error == 1) {
                msgbox.innerHTML = text;
            } else {
                msgbox.innerHTML = String.fromCharCode(text);
            }
        }
    },

    setup: function(code, tapelength, inputs) {
        this.report('Running...',0,1)
        this.loop_depth = 0;
        this.error = 0;
        this.abort = 0;
        this.ticker = 0;
        this.bytemode = document.getElementById('asciimode').checked;
        this.bfcode = code;
        this.codepos = 0;
        this.pointer = 0;
        this.tape = new Array(tapelength).fill(0);
        if (!this.bytemode) {
            if (inputs == "") {this.inputs = []} else { this.inputs = inputs.split(',').reverse(); }
        } else {
            var ascii_arr = [];
            for (var i = 0; i<inputs.length; i++) {
                ascii_arr.push(inputs[i].charCodeAt())
            }
            this.inputs = ascii_arr.reverse();
        }
    },

    fuck_me: async function() {

        this.enable_input(0)

        var overwrite = 1;

        while (this.codepos < this.bfcode.length) {

            this.ticker += 1;

            this.update_visual_table()

            if (this.abort) { this.report('Aborted!',1); break; }

            if (this.loop_depth < 0) { this.report('Error: unmatched bracket',1); break; }

            if (this.ticker > 999999) { this.report('Aborted: computation took too long',1); break; }

            var ch = this.bfcode[this.codepos];

            if (ch == '.') {
                this.report(this.tape[this.pointer],0,overwrite)
                overwrite = 0;
                this.codepos += 1;
            } else if (ch == ',') {
                if (this.inputs.length == 0 ) { this.tape[this.pointer] = 0; this.codepos += 1; }
                else if (isNaN(this.inputs.slice(-1)[0])) { this.report('Error: non-numerical input',1); break; }
                else if (Number(this.inputs.slice(-1)[0]) < 0){ this.report('Error: negative input',1); break; }
                else { this.tape[this.pointer] = Number(this.inputs.pop()); this.codepos += 1; }
            } else if (ch == '+') {
                this.tape[this.pointer] += 1;
                if (this.bytemode && this.tape[this.pointer] == 256) { this.tape[this.pointer] = 0; }
                this.codepos += 1;
            } else if (ch == '-') {
                if (this.tape[this.pointer] > 0) { this.tape[this.pointer] += -1; this.codepos += 1; }
                else if (this.bytemode) { this.tape[this.pointer] = 255; this.codepos += 1; }
                else { this.report('Error: subtraction from zero',1); break; }
            } else if (ch == '>') {
                this.pointer += 1;
                if (this.pointer >= this.tape.length) { this.report('Error: out of bounds (right)',1); break; }
                else { this.codepos += 1; }
            } else if (ch == '<') {
                this.pointer += -1;
                if (this.pointer < 0) { this.report('Error: out of bounds (left)',1); break; }
                else { this.codepos += 1; }
            } else if (ch == '[') {
                if (this.tape[this.pointer] == 0) { 
                    match_pos = this.match_bracket(this.bfcode, this.codepos);
                    if (match_pos == 'error') { this.report('Error: unmatched bracket',1); break; }
                    else { this.codepos = match_pos+1 }
                } else { this.codepos += 1; this.loop_depth += 1; }
            } else if (ch == ']') {
                if (this.tape[this.pointer] == 0) { this.codepos += 1; }
                else {
                    match_pos = this.match_bracket(this.bfcode, this.codepos);
                    if (match_pos == 'error') { this.report('Error: unmatched bracket',1); break; }
                    else { this.codepos = match_pos }
                } 
                this.loop_depth += -1;
            } else {
                this.report('Error: invalid code character',1)
                break;
            }
        
            var wait_time = ((2000-Number(document.getElementById('waittime').value))**3)/2000**2;
            var hide_steps = document.getElementById('showsteps').checked;
            if (!hide_steps) { await this.sleep(wait_time); }

        }

        if (this.loop_depth != 0 && this.error == 0) { this.report('Error: unmatched bracket',1); }

        this.update_visual_table()

        this.enable_input(1)

    },

    match_bracket: function(code, position) {
        // note: code[position] must be the '[' character
        var pos = position;
        var counter = 1;
        var sgn = (code[pos]=='[' ? 1 : -1)
        while (counter > 0) {
            pos += sgn;
            if (pos >= code.length || pos < 0) { return 'error' }
            else if (code[pos] == '[') { counter += sgn }
            else if (code[pos] == ']') { counter += -sgn }
        }
        return pos
    },

    code_submitted: function() {
        var bfcode = document.getElementById('codetext').value.replace(/\s/g,'');
        var inputs = document.getElementById('inputtext').value.replace(/\s/g,'');
        var tapelength = Number(document.getElementById('cellnumber').value);
        this.setup(bfcode, tapelength, inputs)
        this.fuck_me()
    },

    update_visual_table: function() {
        var tape_row = document.getElementById('tape');
        tape_row.innerHTML = '';
        for (var i in this.tape) {
            var td = document.createElement('td');
            td.classList.add('cell');
            td.innerHTML = this.tape[i];
            if (i == this.pointer) { td.style.border = '2px solid #b800e6'; td.style.backgroundColor = '#e580ff'; }
            tape_row.appendChild(td)
        }
    },

    enable_input: function(bool) {
        var elements = [
            document.getElementById('codetext'),
            document.getElementById('inputtext'),
            document.getElementById('cellnumber')
        ]
        for (var i in elements) {
            var el = elements[i];
            if (bool) {
                el.removeAttribute('readonly')
            } else {
                el.setAttribute('readonly', 1)
            }
        }
    }

}

Machine.update_visual_table()

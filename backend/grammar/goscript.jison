%lex
%%

\s+                                     { /* ignorar */ }
"//".*                                  { /* comentario linea */ }
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]    { /* comentario multilinea */ }
"fmt.Println"                           { return 'PRINTLN'; }
"strconv.Atoi"                          { return 'ATOI'; }
"strconv.ParseFloat"                    { return 'PARSEFLOAT'; }
"reflect.TypeOf"                        { return 'TYPEOF'; }
"strings.Join"                          { return 'STRINGS_JOIN'; }
"slices.Index"                          { return 'SLICES_INDEX'; }
"append"                                { return 'APPEND'; }
"len"                                   { return 'LEN'; }
"func"                                  { return 'FUNC'; }
"var"                                   { return 'VAR'; }
"if"                                    { return 'IF'; }
"else"                                  { return 'ELSE'; }
"for"                                   { return 'FOR'; }
"return"                                { return 'RETURN'; }
"break"                                 { return 'BREAK'; }
"continue"                              { return 'CONTINUE'; }
"switch"                                { return 'SWITCH'; }
"case"                                  { return 'CASE'; }
"default"                               { return 'DEFAULT'; }
"struct"                                { return 'STRUCT'; }
"range"                                 { return 'RANGE'; }
"nil"                                   { return 'NIL'; }
"true"                                  { return 'TRUE'; }
"false"                                 { return 'FALSE'; }
"int"                                   { return 'TINT'; }
"float64"                               { return 'TFLOAT'; }
"string"                                { return 'TSTRING'; }
"bool"                                  { return 'TBOOL'; }
"rune"                                  { return 'TRUNE'; }
":="                                    { return 'DECL_ASSIGN'; }
"+="                                    { return 'PLUS_ASSIGN'; }
"-="                                    { return 'MINUS_ASSIGN'; }
"=="                                    { return 'EQ'; }
"!="                                    { return 'NEQ'; }
">="                                    { return 'GEQ'; }
"<="                                    { return 'LEQ'; }
"&&"                                    { return 'AND'; }
"||"                                    { return 'OR'; }
"++"                                    { return 'INC'; }
"--"                                    { return 'DEC'; }
"+"                                     { return 'PLUS'; }
"-"                                     { return 'MINUS'; }
"*"                                     { return 'TIMES'; }
"/"                                     { return 'DIV'; }
"%"                                     { return 'MOD'; }
"="                                     { return 'ASSIGN'; }
"<"                                     { return 'LT'; }
">"                                     { return 'GT'; }
"!"                                     { return 'NOT'; }
"("                                     { return 'LPAREN'; }
")"                                     { return 'RPAREN'; }
"{"                                     { return 'LBRACE'; }
"}"                                     { return 'RBRACE'; }
"["                                     { return 'LBRACKET'; }
"]"                                     { return 'RBRACKET'; }
";"                                     { return 'SEMI'; }
","                                     { return 'COMMA'; }
"."                                     { return 'DOT'; }
":"                                     { return 'COLON'; }
[0-9]+"."[0-9]+                         { return 'FLOAT_LIT'; }
[0-9]+                                  { return 'INT_LIT'; }
\"([^\"\\]|\\.)*\"                      { return 'STRING_LIT'; }
\'([^\'\\]|\\.)+\'                      { return 'RUNE_LIT'; }
[a-zA-Z_][a-zA-Z0-9_]*                 { return 'ID'; }
<<EOF>>                                 { return 'EOF'; }
.                                       { /* ignorar caracter invalido */ }

/lex

%right ASSIGN PLUS_ASSIGN MINUS_ASSIGN
%left OR
%left AND
%left EQ NEQ
%left LT GT GEQ LEQ
%left PLUS MINUS
%left TIMES DIV MOD
%right NOT UMINUS
%nonassoc LOWER_THAN_ELSE
%nonassoc ELSE

%start program
%expect 200

%%

program
    : decl_list EOF
        { return { type: 'Program', body: $1 }; }
    ;

decl_list
    : decl_list decl
        { $$ = $1; $$.push($2); }
    |
        { $$ = []; }
    ;

decl
    : func_decl
    | struct_decl
    | var_stmt opt_semi
    ;

opt_semi
    : SEMI
    |
    ;

struct_decl
    : STRUCT ID LBRACE struct_fields RBRACE
        { $$ = { type: 'StructDecl', name: $2, fields: $4, line: @1.first_line, col: @1.first_column }; }
    ;

struct_fields
    : struct_fields struct_field
        { $$ = $1; $$.push($2); }
    | struct_field
        { $$ = [$1]; }
    ;

struct_field
    : type_spec ID SEMI
        { $$ = { type: 'StructField', fieldType: $1, name: $2 }; }
    | type_spec ID
        { $$ = { type: 'StructField', fieldType: $1, name: $2 }; }
    ;

func_decl
    : FUNC ID LPAREN param_list RPAREN type_spec LBRACE stmt_list RBRACE
        { $$ = { type: 'FuncDecl', name: $2, params: $4, returnType: $6, body: $8, line: @1.first_line, col: @1.first_column }; }
    | FUNC ID LPAREN param_list RPAREN LBRACE stmt_list RBRACE
        { $$ = { type: 'FuncDecl', name: $2, params: $4, returnType: null, body: $7, line: @1.first_line, col: @1.first_column }; }
    ;

param_list
    : param_list COMMA param
        { $$ = $1; $$.push($3); }
    | param
        { $$ = [$1]; }
    |
        { $$ = []; }
    ;

param
    : ID type_spec
        { $$ = { name: $1, paramType: $2 }; }
    ;

type_spec
    : base_type
    | LBRACKET RBRACKET LBRACKET RBRACKET type_spec
        { $$ = '[][]' + $5; }
    | LBRACKET RBRACKET type_spec
        { $$ = '[]' + $3; }
    ;

base_type
    : TINT          { $$ = 'int'; }
    | TFLOAT        { $$ = 'float64'; }
    | TSTRING       { $$ = 'string'; }
    | TBOOL         { $$ = 'bool'; }
    | TRUNE         { $$ = 'rune'; }
    | ID            { $$ = $1; }
    ;

stmt_list
    : stmt_list stmt
        { $$ = $1; if ($2 !== null) $$.push($2); }
    |
        { $$ = []; }
    ;

stmt
    : var_stmt opt_semi
        { $$ = $1; }
    | ID ID ASSIGN anon_struct_lit opt_semi
        { $$ = { type: 'VarDecl', name: $2, varType: $1, value: $4, line: @1.first_line, col: @1.first_column }; }
    | ID ID ASSIGN expr opt_semi
        { $$ = { type: 'VarDecl', name: $2, varType: $1, value: $4, line: @1.first_line, col: @1.first_column }; }
    | assign_stmt opt_semi
        { $$ = $1; }
    | if_stmt
    | for_stmt
    | switch_stmt
    | return_stmt opt_semi
        { $$ = $1; }
    | BREAK opt_semi
        { $$ = { type: 'Break', line: @1.first_line, col: @1.first_column }; }
    | CONTINUE opt_semi
        { $$ = { type: 'Continue', line: @1.first_line, col: @1.first_column }; }
    | block_stmt
    | expr opt_semi
        { $$ = { type: 'ExprStmt', expr: $1, line: @1.first_line }; }
    ;

block_stmt
    : LBRACE stmt_list RBRACE
        { $$ = { type: 'Block', body: $2, line: @1.first_line, col: @1.first_column }; }
    ;

var_stmt
    : VAR ID type_spec ASSIGN expr
        { $$ = { type: 'VarDecl', name: $2, varType: $3, value: $5, line: @1.first_line, col: @1.first_column }; }
    | VAR ID type_spec ASSIGN struct_lit
        { $$ = { type: 'VarDecl', name: $2, varType: $3, value: $5, line: @1.first_line, col: @1.first_column }; }
    | VAR ID type_spec
        { $$ = { type: 'VarDecl', name: $2, varType: $3, value: null, line: @1.first_line, col: @1.first_column }; }
    | ID DECL_ASSIGN expr
        { $$ = { type: 'ShortVarDecl', name: $1, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID DECL_ASSIGN struct_lit
        { $$ = { type: 'ShortVarDecl', name: $1, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID DECL_ASSIGN anon_struct_lit
        { $$ = { type: 'ShortVarDecl', name: $1, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID ID ASSIGN anon_struct_lit
        { $$ = { type: 'VarDecl', name: $2, varType: $1, value: $4, line: @1.first_line, col: @1.first_column }; }
    | ID ID ASSIGN expr
        { $$ = { type: 'VarDecl', name: $2, varType: $1, value: $4, line: @1.first_line, col: @1.first_column }; }
    ;

assign_stmt
    : ID ASSIGN expr
        { $$ = { type: 'Assign', target: { type: 'Identifier', name: $1 }, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET ASSIGN expr
        { $$ = { type: 'Assign', target: { type: 'IndexAccess', object: $1, index: $3 }, value: $6, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET LBRACKET expr RBRACKET ASSIGN expr
        { $$ = { type: 'Assign', target: { type: 'MatrixAccess', object: $1, row: $3, colIdx: $6 }, value: $9, line: @1.first_line, col: @1.first_column }; }
    | ID DOT ID ASSIGN expr
        { $$ = { type: 'Assign', target: { type: 'FieldAccess', object: $1, field: $3 }, value: $5, line: @1.first_line, col: @1.first_column }; }
    | ID PLUS_ASSIGN expr
        { $$ = { type: 'CompoundAssign', op: '+=', target: { type: 'Identifier', name: $1 }, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID MINUS_ASSIGN expr
        { $$ = { type: 'CompoundAssign', op: '-=', target: { type: 'Identifier', name: $1 }, value: $3, line: @1.first_line, col: @1.first_column }; }
    | ID INC
        { $$ = { type: 'Increment', target: { type: 'Identifier', name: $1 }, line: @1.first_line, col: @1.first_column }; }
    | ID DEC
        { $$ = { type: 'Decrement', target: { type: 'Identifier', name: $1 }, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET INC
        { $$ = { type: 'Increment', target: { type: 'IndexAccess', object: $1, index: $3 }, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET DEC
        { $$ = { type: 'Decrement', target: { type: 'IndexAccess', object: $1, index: $3 }, line: @1.first_line, col: @1.first_column }; }
    ;

if_stmt
    : IF expr block_stmt %prec LOWER_THAN_ELSE
        { $$ = { type: 'If', condition: $2, then: $3.body, elseifs: [], else: null, line: @1.first_line, col: @1.first_column }; }
    | IF expr block_stmt else_chain
        { $$ = { type: 'If', condition: $2, then: $3.body, elseifs: $4.elseifs, else: $4.else, line: @1.first_line, col: @1.first_column }; }
    | IF LPAREN expr RPAREN block_stmt %prec LOWER_THAN_ELSE
        { $$ = { type: 'If', condition: $3, then: $5.body, elseifs: [], else: null, line: @1.first_line, col: @1.first_column }; }
    | IF LPAREN expr RPAREN block_stmt else_chain
        { $$ = { type: 'If', condition: $3, then: $5.body, elseifs: $6.elseifs, else: $6.else, line: @1.first_line, col: @1.first_column }; }
    ;

else_chain
    : ELSE IF expr block_stmt %prec LOWER_THAN_ELSE
        { $$ = { elseifs: [{ condition: $3, body: $4.body }], else: null }; }
    | ELSE IF expr block_stmt else_chain
        { $$ = { elseifs: [{ condition: $3, body: $4.body }].concat($5.elseifs), else: $5.else }; }
    | ELSE block_stmt
        { $$ = { elseifs: [], else: $2.body }; }
    ;

for_stmt
    : FOR expr block_stmt
        { $$ = { type: 'ForWhile', condition: $2, body: $3.body, line: @1.first_line, col: @1.first_column }; }
    | FOR var_stmt SEMI expr SEMI for_post block_stmt
        { $$ = { type: 'ForC', init: $2, condition: $4, post: $6, body: $7.body, line: @1.first_line, col: @1.first_column }; }
    | FOR assign_stmt SEMI expr SEMI for_post block_stmt
        { $$ = { type: 'ForC', init: $2, condition: $4, post: $6, body: $7.body, line: @1.first_line, col: @1.first_column }; }
    | FOR ID COMMA ID DECL_ASSIGN RANGE ID block_stmt
        { $$ = { type: 'ForRange', indexVar: $2, valueVar: $4, iterable: $7, body: $8.body, line: @1.first_line, col: @1.first_column }; }
    ;

for_post
    : assign_stmt       { $$ = $1; }
    ;

switch_stmt
    : SWITCH expr LBRACE case_list RBRACE
        { $$ = { type: 'Switch', expr: $2, cases: $4, line: @1.first_line, col: @1.first_column }; }
    ;

case_list
    : case_list case_item
        { $$ = $1; $$.push($2); }
    |
        { $$ = []; }
    ;

case_item
    : CASE expr COLON stmt_list
        { $$ = { type: 'Case', value: $2, body: $4, line: @1.first_line, col: @1.first_column }; }
    | DEFAULT COLON stmt_list
        { $$ = { type: 'Default', body: $3, line: @1.first_line, col: @1.first_column }; }
    ;

return_stmt
    : RETURN
        { $$ = { type: 'Return', value: null, line: @1.first_line, col: @1.first_column }; }
    | RETURN expr
        { $$ = { type: 'Return', value: $2, line: @1.first_line, col: @1.first_column }; }
    ;

expr
    : expr OR expr
        { $$ = { type: 'BinaryOp', op: '||', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr AND expr
        { $$ = { type: 'BinaryOp', op: '&&', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr EQ expr
        { $$ = { type: 'BinaryOp', op: '==', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr NEQ expr
        { $$ = { type: 'BinaryOp', op: '!=', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr LT expr
        { $$ = { type: 'BinaryOp', op: '<', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr GT expr
        { $$ = { type: 'BinaryOp', op: '>', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr GEQ expr
        { $$ = { type: 'BinaryOp', op: '>=', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr LEQ expr
        { $$ = { type: 'BinaryOp', op: '<=', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr PLUS expr
        { $$ = { type: 'BinaryOp', op: '+', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr MINUS expr
        { $$ = { type: 'BinaryOp', op: '-', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr TIMES expr
        { $$ = { type: 'BinaryOp', op: '*', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr DIV expr
        { $$ = { type: 'BinaryOp', op: '/', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | expr MOD expr
        { $$ = { type: 'BinaryOp', op: '%', left: $1, right: $3, line: @1.first_line, col: @1.first_column }; }
    | NOT expr
        { $$ = { type: 'UnaryOp', op: '!', expr: $2, line: @1.first_line, col: @1.first_column }; }
    | MINUS expr %prec UMINUS
        { $$ = { type: 'UnaryOp', op: '-', expr: $2, line: @1.first_line, col: @1.first_column }; }
    | LPAREN expr RPAREN
        { $$ = $2; }
    | primary
        { $$ = $1; }
    ;

primary
    : INT_LIT
        { $$ = { type: 'IntLit', value: parseInt($1), line: @1.first_line, col: @1.first_column }; }
    | FLOAT_LIT
        { $$ = { type: 'FloatLit', value: parseFloat($1), line: @1.first_line, col: @1.first_column }; }
    | STRING_LIT
        { $$ = { type: 'StringLit', value: $1.slice(1,-1), line: @1.first_line, col: @1.first_column }; }
    | RUNE_LIT
        { var ch = $1.slice(1,-1); $$ = { type: 'RuneLit', value: ch === '\\n' ? 10 : ch === '\\t' ? 9 : ch.charCodeAt(0), line: @1.first_line, col: @1.first_column }; }
    | TRUE
        { $$ = { type: 'BoolLit', value: true, line: @1.first_line, col: @1.first_column }; }
    | FALSE
        { $$ = { type: 'BoolLit', value: false, line: @1.first_line, col: @1.first_column }; }
    | NIL
        { $$ = { type: 'NilLit', line: @1.first_line, col: @1.first_column }; }
    | ID LPAREN arg_list RPAREN
        { $$ = { type: 'FuncCall', name: $1, args: $3, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET LBRACKET expr RBRACKET
        { $$ = { type: 'MatrixAccess', object: $1, row: $3, colIdx: $6, line: @1.first_line, col: @1.first_column }; }
    | ID LBRACKET expr RBRACKET
        { $$ = { type: 'IndexAccess', object: $1, index: $3, line: @1.first_line, col: @1.first_column }; }
    | ID DOT ID LPAREN arg_list RPAREN
        { $$ = { type: 'FuncCall', name: $1 + '.' + $3, args: $5, line: @1.first_line, col: @1.first_column }; }
    | ID DOT ID
        { $$ = { type: 'FieldAccess', object: $1, field: $3, line: @1.first_line, col: @1.first_column }; }
    | ID
        { $$ = { type: 'Identifier', name: $1, line: @1.first_line, col: @1.first_column }; }
    | slice_lit     { $$ = $1; }
    | matrix_lit    { $$ = $1; }
    | builtin_call  { $$ = $1; }
    ;

builtin_call
    : PRINTLN LPAREN arg_list RPAREN
        { $$ = { type: 'PrintlnCall', args: $3, line: @1.first_line, col: @1.first_column }; }
    | ATOI LPAREN expr RPAREN
        { $$ = { type: 'AtoiCall', arg: $3, line: @1.first_line, col: @1.first_column }; }
    | PARSEFLOAT LPAREN expr RPAREN
        { $$ = { type: 'ParseFloatCall', arg: $3, line: @1.first_line, col: @1.first_column }; }
    | TYPEOF LPAREN expr RPAREN DOT ID
        { $$ = { type: 'TypeOfCall', arg: $3, line: @1.first_line, col: @1.first_column }; }
    | TYPEOF LPAREN expr RPAREN
        { $$ = { type: 'TypeOfCall', arg: $3, line: @1.first_line, col: @1.first_column }; }
    | APPEND LPAREN expr COMMA expr RPAREN
        { $$ = { type: 'AppendCall', slice: $3, value: $5, line: @1.first_line, col: @1.first_column }; }
    | LEN LPAREN expr RPAREN
        { $$ = { type: 'LenCall', arg: $3, line: @1.first_line, col: @1.first_column }; }
    | SLICES_INDEX LPAREN expr COMMA expr RPAREN
        { $$ = { type: 'SlicesIndexCall', slice: $3, value: $5, line: @1.first_line, col: @1.first_column }; }
    | STRINGS_JOIN LPAREN expr COMMA expr RPAREN
        { $$ = { type: 'StringsJoinCall', slice: $3, sep: $5, line: @1.first_line, col: @1.first_column }; }
    ;

arg_list
    : arg_list COMMA expr
        { $$ = $1; $$.push($3); }
    | expr
        { $$ = [$1]; }
    |
        { $$ = []; }
    ;

slice_lit
    : LBRACKET RBRACKET type_spec LBRACE expr_list RBRACE
        { $$ = { type: 'SliceLit', elemType: $3, elements: $5, line: @1.first_line, col: @1.first_column }; }
    | LBRACKET RBRACKET type_spec LBRACE RBRACE
        { $$ = { type: 'SliceLit', elemType: $3, elements: [], line: @1.first_line, col: @1.first_column }; }
    | LBRACKET RBRACKET type_spec LBRACE expr_list COMMA RBRACE
        { $$ = { type: 'SliceLit', elemType: $3, elements: $5, line: @1.first_line, col: @1.first_column }; }
    ;

matrix_lit
    : LBRACKET RBRACKET LBRACKET RBRACKET type_spec LBRACE matrix_rows RBRACE
        { $$ = { type: 'MatrixLit', elemType: $5, rows: $7, line: @1.first_line, col: @1.first_column }; }
    ;

expr_list
    : expr_list COMMA expr
        { $$ = $1; $$.push($3); }
    | expr_list COMMA
        { $$ = $1; }
    | expr
        { $$ = [$1]; }
    ;

matrix_rows
    : matrix_rows COMMA matrix_row
        { $$ = $1; $$.push($3); }
    | matrix_rows COMMA
        { $$ = $1; }
    | matrix_row
        { $$ = [$1]; }
    ;

matrix_row
    : LBRACE expr_list RBRACE
        { $$ = $2; }
    | LBRACE RBRACE
        { $$ = []; }
    ;

struct_lit
    : ID LBRACE field_list RBRACE
        { $$ = { type: 'StructLit', structName: $1, fields: $3, line: @1.first_line, col: @1.first_column }; }
    ;

anon_struct_lit
    : LBRACE field_list RBRACE
        { $$ = { type: 'AnonStructLit', fields: $2, line: @1.first_line, col: @1.first_column }; }
    ;

field_list
    : field_list COMMA field_assign
        { $$ = $1; $$.push($3); }
    | field_list COMMA
        { $$ = $1; }
    | field_assign
        { $$ = [$1]; }
    |
        { $$ = []; }
    ;

field_assign
    : ID COLON expr
        { $$ = { name: $1, value: $3 }; }
    ;

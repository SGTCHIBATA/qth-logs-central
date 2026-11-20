ALTER TABLE public.viaturas
    DROP CONSTRAINT IF EXISTS viaturas_status_check;

ALTER TABLE public.viaturas
    ADD CONSTRAINT viaturas_status_check
    CHECK (UPPER(status) IN (
        'DISPONIVEL',
        'ACIONADA',
        'EMPENHADA',
        'QTI',
        'NO QTH',
        'QTI UNIDADE SAUDE',
        'NA UNIDADE SAUDE',
        'QTI BASE QAP',
        'QTI BASE SEM CONDICOES',
        'SEM CONDICOES',
        'INTERCORRENCIA',
        'BAIXADA'
    ));
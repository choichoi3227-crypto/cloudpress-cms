<?php
// src/php-bridge/d1-pdo.php
// PHP-Wasm 시작 시 주입될 클래스
class D1_PDO extends PDO {
    private $db_name;

    public function __construct($dsn) {
        // 실제 커넥션 대신 식별자만 저장
        $this->db_name = $dsn;
    }

    public function query($statement, $mode = PDO::ATTR_DEFAULT_FETCH_MODE, ...$fetch_details) {
        // JS에 등록된 'd1_query_bridge' 함수를 호출
        $json_result = d1_query_bridge($statement); // JS 함수 호출
        $result_data = json_decode($json_result, true);

        if (isset($result_data['error'])) {
            throw new PDOException("D1 Query Error: " . $result_data['error']);
        }
        return new D1_Statement($result_data);
    }

    public function prepare($statement, $options = []) {
        return new D1_Statement($statement);
    }
}

class D1_Statement {
    private $sql;
    private $bound_params = [];
    private $result_rows = [];
    private $current_row_index = 0;

    public function __construct($sql_or_data) {
        if (is_array($sql_or_data)) {
            $this->result_rows = $sql_or_data; // query()에서 직접 데이터를 받은 경우
        } else {
            $this->sql = $sql_or_data; // prepare()에서 SQL을 받은 경우
        }
    }
    
    public function bindParam($param, &$var, $type = PDO::PARAM_STR, $maxLength = null, $driverOptions = null) {
        $this->bound_params[$param] = &$var;
    }

    public function bindValue($param, $value, $type = PDO::PARAM_STR) {
        $this->bound_params[$param] = $value;
    }

    public function execute($params = null) {
        if ($params) {
            $this->bound_params = array_merge($this->bound_params, $params);
        }
        
        // JS에 등록된 'd1_execute_bridge' 함수를 호출
        $json_result = d1_execute_bridge($this->sql, json_encode($this->bound_params));
        $result = json_decode($json_result, true);

        if (isset($result['error'])) {
            throw new PDOException("D1 Execute Error: " . $result['error']);
        }
        $this->result_rows = $result['results'] ?? [];
        $this->current_row_index = 0;
        return $result['success'] ?? false;
    }

    public function fetch($fetch_style = PDO::FETCH_ASSOC, $cursor_orientation = PDO::FETCH_ORI_NEXT, $offset = 0) {
        if ($this->current_row_index < count($this->result_rows)) {
            $row = $this->result_rows[$this->current_row_index];
            $this->current_row_index++;
            return $row;
        }
        return false;
    }

    public function fetchAll($fetch_style = PDO::FETCH_ASSOC, $fetch_argument = null, $ctor_args = null) {
        return $this->result_rows;
    }

    public function rowCount() {
        // D1의 run() 결과에는 rowCount가 없으므로, fetchAll 후 count()로 대체
        return count($this->result_rows);
    }
}

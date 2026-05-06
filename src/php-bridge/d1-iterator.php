<?php
// src/php-bridge/d1-iterator.php
// [PHP] 지연 로딩을 구현한 반복자 클래스
class D1_Result_Iterator implements Iterator {
    private $queryId;
    private $currentIndex = 0;
    private $currentRow = null;
    private $totalRows = 0; // 총 행 수를 미리 알 수 있다면 설정

    public function __construct($queryId, $totalRows = 0) {
        $this->queryId = $queryId;
        $this->totalRows = $totalRows;
    }

    public function current() {
        if ($this->currentRow === null) {
            $json = d1_fetch_row_lazy($this->queryId, $this->currentIndex); // JS 함수 호출
            $this->currentRow = json_decode($json, true);
        }
        return $this->currentRow;
    }

    public function next() {
        $this->currentIndex++;
        $this->currentRow = null;
    }

    public function key() {
        return $this->currentIndex;
    }

    public function valid() {
        // totalRows를 알면 더 효율적
        return $this->currentIndex < $this->totalRows; // 또는 d1_has_next_row_lazy() 같은 JS 함수 호출
    }

    public function rewind() {
        $this->currentIndex = 0;
        $this->currentRow = null;
    }
}

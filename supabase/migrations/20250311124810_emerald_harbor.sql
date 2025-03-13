/*
  # Add indexes and views for analytics

  1. Changes
    - Add indexes for analytics queries
    - Create materialized view for common issues
    - Add status column index

  2. Security
    - Add policies for analytics views
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_petitions_college_name ON petitions(college_name);
CREATE INDEX IF NOT EXISTS idx_petitions_created_at ON petitions(created_at);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);

-- Create a view for common issues analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS petition_issues_summary AS
SELECT
  CASE
    WHEN problem_description ~* 'job|career|employment|placement' THEN 'Job Prospects'
    WHEN problem_description ~* 'higher education|masters|further studies' THEN 'Higher Education'
    WHEN problem_description ~* 'recognition|validity|acceptance' THEN 'Recognition'
    WHEN problem_description ~* 'training|internship|practical' THEN 'Industry Training'
    ELSE 'Other'
  END as category,
  COUNT(*) as count
FROM petitions
WHERE status != 'rejected'
GROUP BY category;

-- Add policy for reading analytics
CREATE POLICY "Allow authenticated users to read analytics"
  ON petition_issues_summary
  FOR SELECT
  TO authenticated
  USING (true);